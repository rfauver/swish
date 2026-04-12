import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { EspnCompetitor } from "../../api/scores";
import { fetchScoreboard } from "../../api/scores";
import {
  formatDateLabel,
  formatGameTime,
  fromESPNDate,
  todayESPN,
} from "../../lib/dates";
import { getPeriodLabel } from "../../lib/game";
import ScoringTimeline from "./ScoringTimeline";
import BoxScore from "./BoxScore";
import styles from "./GamePage.module.css";

export default function GamePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const date = searchParams.get("date") ?? todayESPN();

  const { data, isPending } = useQuery({
    queryKey: ["scoreboard", date],
    queryFn: () => fetchScoreboard(date),
  });

  const event = data?.events.find((e) => e.id === eventId);

  if (!event) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.back} onClick={() => navigate(-1)}>
            ‹
          </button>
        </header>
        {!isPending && <p className={styles.message}>Game not found.</p>}
      </div>
    );
  }

  const competition = event.competitions[0];
  const { status } = competition;
  const state = status.type.state;
  const away = competition.competitors.find((c) => c.homeAway === "away")!;
  const home = competition.competitors.find((c) => c.homeAway === "home")!;

  const awayScore = Number(away.score);
  const homeScore = Number(home.score);
  const awayWon = state === "post" && awayScore > homeScore;
  const homeWon = state === "post" && homeScore > awayScore;
  const showScores = state === "in" || state === "post";

  const maxPeriod = showScores
    ? Math.max(
        4,
        ...away.linescores.map((l) => l.period),
        ...home.linescores.map((l) => l.period),
      )
    : 0;
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  function getPeriodScore(competitor: EspnCompetitor, period: number): string {
    return (
      competitor.linescores.find((l) => l.period === period)?.displayValue ??
      "–"
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          ‹
        </button>
        {/* Matchup */}
        <div className={styles.matchup}>
          <div className={styles.matchupTeam}>
            <img
              src={away.team.logo}
              alt={away.team.displayName}
              className={styles.matchupLogo}
              width={64}
              height={64}
            />
            <span className={styles.matchupName}>{away.team.name}</span>
          </div>

          <div className={styles.matchupCenter}>
            {showScores && (
              <div className={styles.matchupScores}>
                <span
                  className={
                    awayWon ? styles.matchupScoreWin : styles.matchupScore
                  }
                >
                  {away.score}
                </span>
                <span className={styles.matchupDash}>–</span>
                <span
                  className={
                    homeWon ? styles.matchupScoreWin : styles.matchupScore
                  }
                >
                  {home.score}
                </span>
              </div>
            )}
            <span className={styles.matchupStatus}>
              {showScores
                ? status.type.shortDetail
                : `${formatDateLabel(fromESPNDate(date))} · ${formatGameTime(event.date)}`}
            </span>
          </div>

          <div className={styles.matchupTeam}>
            <img
              src={home.team.logo}
              alt={home.team.displayName}
              className={styles.matchupLogo}
              width={64}
              height={64}
            />
            <span className={styles.matchupName}>{home.team.name}</span>
          </div>
        </div>
      </header>

      <div className={styles.cardsContainer}>
        {/* Linescore table */}
        {showScores && (
          <div className={styles.gamePageCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.teamCell} />
                    {periods.map((p) => (
                      <th key={p} className={styles.periodCell}>
                        {getPeriodLabel(p)}
                      </th>
                    ))}
                    <th className={styles.totalCell}>T</th>
                  </tr>
                </thead>
                <tbody>
                  {[away, home].map((competitor) => {
                    const won = competitor === away ? awayWon : homeWon;
                    return (
                      <tr key={competitor.id}>
                        <td className={styles.teamCell}>
                          <div className={styles.teamCellInner}>
                            <img
                              src={competitor.team.logo}
                              alt={competitor.team.abbreviation}
                              className={styles.tableTeamLogo}
                              width={20}
                              height={20}
                            />
                            <span>{competitor.team.abbreviation}</span>
                          </div>
                        </td>
                        {periods.map((p) => (
                          <td key={p} className={styles.periodCell}>
                            {getPeriodScore(competitor, p)}
                          </td>
                        ))}
                        <td
                          className={`${styles.totalCell} ${won ? styles.totalWin : ""}`}
                        >
                          {competitor.score}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scoring timeline chart */}
        {showScores && eventId && (
          <div className={styles.gamePageCard}>
            <ScoringTimeline
              eventId={eventId}
              awayTeam={away.team}
              homeTeam={home.team}
              isLive={state === "in"}
            />
          </div>
        )}

        {/* Box score */}
        {showScores && eventId && (
          <div className={styles.gamePageCard}>
            <BoxScore eventId={eventId} isLive={state === "in"} />
          </div>
        )}
      </div>
    </div>
  );
}
