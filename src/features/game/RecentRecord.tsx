import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchTeamSchedule } from "../../api/schedule";
import type { EspnTeam } from "../../api/scores";
import styles from "./RecentRecord.module.css";

interface Props {
  awayTeam: EspnTeam;
  homeTeam: EspnTeam;
  seasonYear: number;
}

interface GameResult {
  won: boolean;
  teamScore: string;
  opponentScore: string;
  opponentAbbrev: string;
  opponentLogo?: string;
}

const SEASON_TYPES = [2, 3, 5]; // regular, playoffs, play-in

function useLast5(
  teamId: string,
  seasonYear: number,
): GameResult[] | undefined {
  const queries = useQueries({
    queries: SEASON_TYPES.map((st) => ({
      queryKey: ["schedule", teamId, seasonYear, st],
      queryFn: () => fetchTeamSchedule(teamId, seasonYear, st),
      staleTime: 60 * 60 * 1000,
    })),
  });

  const anyPending = queries.some((q) => q.isPending);
  if (anyPending) return undefined;

  const allEvents = queries.flatMap((q) => q.data?.events ?? []);
  const completed = allEvents
    .filter((e) => e.competitions[0].status.type.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return completed.slice(-5).map((e) => {
    const comp = e.competitions[0];
    const teamComp = comp.competitors.find(
      (c) => c.id === teamId || c.team.id === teamId,
    );
    const oppComp = comp.competitors.find(
      (c) => c.id !== teamId && c.team.id !== teamId,
    );
    return {
      won: teamComp?.winner === true,
      teamScore: teamComp?.score?.displayValue ?? "–",
      opponentScore: oppComp?.score?.displayValue ?? "–",
      opponentAbbrev: oppComp?.team.abbreviation ?? "?",
      opponentLogo: oppComp?.team.logos?.[0]?.href,
    };
  });
}

function ResultBoxes({ results }: { results: GameResult[] | undefined }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (!results) {
    return (
      <div className={styles.boxes}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={styles.boxPlaceholder} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.boxes}>
      {results.map((r, i) => (
        <div
          key={i}
          className={styles.boxWrapper}
          onPointerEnter={() => setActiveIdx(i)}
          onPointerLeave={() => setActiveIdx(null)}
        >
          <span className={r.won ? styles.boxWin : styles.boxLoss}>
            {r.won ? "W" : "L"}
          </span>
          {activeIdx === i && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipRow}>
                <span className={styles.tooltipScore}>{r.teamScore}</span>
                <span className={styles.tooltipDash}>–</span>
                <span className={styles.tooltipScore}>
                  {r.opponentScore}
                </span>
                {r.opponentLogo && (
                  <img
                    src={r.opponentLogo}
                    alt={r.opponentAbbrev}
                    className={styles.tooltipLogo}
                    width={14}
                    height={14}
                  />
                )}
                <span className={styles.tooltipAbbrev}>
                  {r.opponentAbbrev}
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function RecentRecord({
  awayTeam,
  homeTeam,
  seasonYear,
}: Props) {
  const awayResults = useLast5(awayTeam.id, seasonYear);
  const homeResults = useLast5(homeTeam.id, seasonYear);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>Last 5</div>
      <div className={styles.row}>
        <div className={styles.teamName}>
          <img
            src={awayTeam.logo}
            alt={awayTeam.abbreviation}
            className={styles.teamLogo}
            width={20}
            height={20}
          />
          <span>{awayTeam.abbreviation}</span>
        </div>
        <ResultBoxes results={awayResults} />
      </div>
      <div className={styles.row}>
        <div className={styles.teamName}>
          <img
            src={homeTeam.logo}
            alt={homeTeam.abbreviation}
            className={styles.teamLogo}
            width={20}
            height={20}
          />
          <span>{homeTeam.abbreviation}</span>
        </div>
        <ResultBoxes results={homeResults} />
      </div>
    </div>
  );
}
