import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { EspnTeam } from "../../api/scores";
import type { SummaryPlay } from "../../api/summary";
import { fetchGameSummary } from "../../api/summary";
import styles from "./ScoringTimeline.module.css";

interface Props {
  eventId: string;
  awayTeam: EspnTeam;
  homeTeam: EspnTeam;
  isLive: boolean;
}

// Convert (period, "MM:SS" clock) to total elapsed seconds in the game
function playToSeconds(period: number, clock: string): number {
  const [min, sec] = clock.includes(":")
    ? clock.split(":").map(Number)
    : [0, Number(clock)];
  const periodDuration = period <= 4 ? 12 * 60 : 5 * 60;
  const base =
    period <= 4 ? (period - 1) * 12 * 60 : 4 * 12 * 60 + (period - 5) * 5 * 60;
  return base + (periodDuration - (min * 60 + sec));
}

// Total elapsed seconds at the end of a given period
function periodEndSeconds(period: number): number {
  return period <= 4 ? period * 12 * 60 : 4 * 12 * 60 + (period - 4) * 5 * 60;
}

// Human-readable label for the quarter a given midpoint second falls in
function secondsToLabel(s: number): string {
  if (s < 720) return "Q1";
  if (s < 1440) return "Q2";
  if (s < 2160) return "Q3";
  if (s < 2880) return "Q4";
  const ot = Math.floor((s - 2880) / 300) + 1;
  return ot === 1 ? "OT" : `${ot}OT`;
}

interface ChartPoint {
  seconds: number;
  diff: number; // awayScore - homeScore (positive = away leading)
}

function buildChartData(plays: SummaryPlay[]): ChartPoint[] {
  const points: ChartPoint[] = [{ seconds: 0, diff: 0 }];

  for (const play of plays) {
    const seconds = playToSeconds(play.period.number, play.clock.displayValue);
    const diff = play.awayScore - play.homeScore;
    const prev = points[points.length - 1];
    const prevDiff = prev.diff;

    // Insert an explicit zero-crossing vertex so the gradient color
    // change happens exactly at the x-axis instead of mid-diagonal.
    if ((prevDiff > 0 && diff < 0) || (prevDiff < 0 && diff > 0)) {
      const t = prevDiff / (prevDiff - diff);
      points.push({
        seconds: prev.seconds + (seconds - prev.seconds) * t,
        diff: 0,
      });
    }

    points.push({ seconds, diff });
  }

  return points;
}

export default function ScoringTimeline({
  eventId,
  awayTeam,
  homeTeam,
  isLive,
}: Props) {
  const { data, isPending } = useQuery({
    queryKey: ["summary", eventId],
    queryFn: () => fetchGameSummary(eventId),
    refetchInterval: isLive ? 30_000 : false,
  });

  if (isPending) {
    return <div className={`${styles.skeleton} ${styles.shimmer}`} />;
  }

  const scoringPlays = (data?.plays ?? []).filter((p) => p.scoringPlay);
  if (scoringPlays.length === 0) return null;

  const chartData = buildChartData(scoringPlays);
  const maxPeriod = Math.max(...scoringPlays.map((p) => p.period.number));
  const totalSeconds = periodEndSeconds(maxPeriod);

  // Vertical dividers between quarters
  const boundaries = Array.from({ length: maxPeriod - 1 }, (_, i) =>
    periodEndSeconds(i + 1),
  );

  // Quarter label ticks at the START of each period (left-anchored)
  const startTicks = Array.from({ length: maxPeriod }, (_, i) =>
    periodEndSeconds(i),
  );

  const awayColor = `#${awayTeam.color}`;
  const homeColor = `#${homeTeam.color}`;

  const maxDiff = Math.max(...chartData.map((p) => p.diff), 1);
  const minDiff = Math.min(...chartData.map((p) => p.diff), -1);
  const zeroPercent = (maxDiff / (maxDiff - minDiff)) * 100;
  const gradId = `score-grad-${eventId}`;

  console.log({ chartData });
  return (
    <div className={styles.wrapper}>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 16, bottom: 0, left: 16 }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={awayColor} stopOpacity={0.8} />
              <stop
                offset={`${zeroPercent}%`}
                stopColor={awayColor}
                stopOpacity={0.8}
              />
              <stop
                offset={`${zeroPercent}%`}
                stopColor={homeColor}
                stopOpacity={0.8}
              />
              <stop offset="100%" stopColor={homeColor} stopOpacity={0.8} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="seconds"
            type="number"
            domain={[0, totalSeconds]}
            ticks={startTicks}
            tickFormatter={secondsToLabel}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "rgba(255,255,255,0.3)",
              fontSize: 10,
              textAnchor: "middle",
            }}
          />
          <YAxis hide domain={[minDiff, maxDiff]} />

          {/* Zero line */}
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />

          {/* Quarter dividers */}
          {boundaries.map((s) => (
            <ReferenceLine
              key={s}
              x={s}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="3 3"
            />
          ))}

          <Area
            type="stepAfter"
            dataKey="diff"
            fill={`url(#${gradId})`}
            stroke="none"
            baseValue={0}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
