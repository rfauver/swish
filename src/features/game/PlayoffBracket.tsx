import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPlayoffScoreboard } from "../../api/playoffs";
import {
  buildBracket,
  findTeamRound,
  roundLabel,
  type Bracket,
  type BracketSeries,
  type RoundId,
} from "../../lib/playoffs";
import SeriesCard from "./SeriesCard";
import styles from "./PlayoffBracket.module.css";

interface Props {
  awayTeamId: string;
  homeTeamId: string;
  seasonYear: number;
}

const ROUNDS: RoundId[] = [1, 2, 3, 4];
const COL_WIDTH = 160;

export default function PlayoffBracket({
  awayTeamId,
  homeTeamId,
  seasonYear,
}: Props) {
  const { data: bracket, isPending } = useQuery({
    queryKey: ["playoffBracket", seasonYear],
    queryFn: () => fetchPlayoffScoreboard(seasonYear),
    select: (data) => buildBracket(data.events),
    staleTime: 5 * 60 * 1000,
  });

  const defaultRound = useMemo(() => {
    if (!bracket) return 1 as RoundId;
    return findTeamRound(bracket, awayTeamId);
  }, [bracket, awayTeamId]);

  const [activeRound, setActiveRound] = useState<RoundId | null>(null);
  const currentRound = activeRound ?? defaultRound;

  const highlightIds = useMemo(
    () => new Set([awayTeamId, homeTeamId]),
    [awayTeamId, homeTeamId],
  );

  if (isPending || !bracket) {
    return <div className={styles.loading}>Loading bracket…</div>;
  }

  const visibleRounds = ROUNDS.filter((r) => r >= currentRound);

  // Split series by conference per round
  const eastByRound = new Map<RoundId, BracketSeries[]>();
  const westByRound = new Map<RoundId, BracketSeries[]>();
  let finalsSeries: BracketSeries | null = null;

  for (const round of ROUNDS) {
    const all = bracket.rounds.get(round) ?? [];
    eastByRound.set(round, all.filter((s) => s.conference === "East"));
    westByRound.set(round, all.filter((s) => s.conference === "West"));
    const f = all.find((s) => s.conference === "Finals");
    if (f) finalsSeries = f;
  }

  // Base rows per conference in the active round
  const baseRowsPerConf =
    currentRound <= 3
      ? (eastByRound.get(currentRound)?.length ?? 1)
      : 1;

  // Total grid rows: East rows + divider row + West rows
  // East occupies rows 1..baseRowsPerConf
  // Divider is a gap (handled by row gap)
  // West occupies rows baseRowsPerConf+1..baseRowsPerConf*2
  const totalRows = baseRowsPerConf * 2;
  const confRounds = visibleRounds.filter((r) => r <= 3);
  const showFinals = visibleRounds.includes(4);
  const totalCols = confRounds.length + (showFinals ? 1 : 0);

  function isHighlighted(s: BracketSeries) {
    return s.teams.some((t) => t && highlightIds.has(t.id));
  }

  // Place series cells into the unified grid
  const cells: JSX.Element[] = [];

  for (let ci = 0; ci < confRounds.length; ci++) {
    const round = confRounds[ci];
    const span = Math.pow(2, round - currentRound);
    const eastSeries = eastByRound.get(round) ?? [];
    const westSeries = westByRound.get(round) ?? [];

    // East series: rows start from 1
    eastSeries.forEach((s, i) => {
      cells.push(
        <div
          key={`e-${round}-${i}`}
          className={styles.cell}
          style={{
            gridColumn: ci + 1,
            gridRow: `${i * span + 1} / span ${span}`,
          }}
        >
          <SeriesCard series={s} isHighlighted={isHighlighted(s)} />
        </div>,
      );
    });

    // West series: rows start after East rows + divider row
    westSeries.forEach((s, i) => {
      const rowStart = baseRowsPerConf + 1 + i * span + 1;
      cells.push(
        <div
          key={`w-${round}-${i}`}
          className={styles.cell}
          style={{
            gridColumn: ci + 1,
            gridRow: `${rowStart} / span ${span}`,
          }}
        >
          <SeriesCard series={s} isHighlighted={isHighlighted(s)} />
        </div>,
      );
    });
  }

  // Finals: rightmost column, spans all rows including divider
  const totalGridRows = baseRowsPerConf * 2 + 1;
  if (showFinals && finalsSeries) {
    cells.push(
      <div
        key="finals"
        className={styles.cell}
        style={{
          gridColumn: totalCols,
          gridRow: `1 / span ${totalGridRows}`,
        }}
      >
        <SeriesCard series={finalsSeries} isHighlighted={isHighlighted(finalsSeries)} />
      </div>,
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        {ROUNDS.map((r) => (
          <button
            key={r}
            className={`${styles.tab} ${r === currentRound ? styles.tabActive : ""}`}
            onClick={() => setActiveRound(r)}
          >
            {roundLabel(r)}
          </button>
        ))}
      </div>
      {currentRound <= 3 ? (
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${totalCols}, ${COL_WIDTH}px)`,
            gridTemplateRows: `repeat(${baseRowsPerConf}, 1fr) 16px repeat(${baseRowsPerConf}, 1fr)`,
          }}
        >
          {cells}
        </div>
      ) : (
        <div className={styles.finalsOnly}>
          <div className={styles.confLabel}>Finals</div>
          {finalsSeries && (
            <SeriesCard
              series={finalsSeries}
              isHighlighted={isHighlighted(finalsSeries)}
            />
          )}
        </div>
      )}
    </div>
  );
}
