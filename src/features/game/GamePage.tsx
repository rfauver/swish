import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { EspnCompetitor } from "../../api/scores";
import { fetchScoreboard } from "../../api/scores";
import { fetchGameSummary } from "../../api/summary";
import {
  formatDateLabel,
  formatGameTime,
  fromESPNDate,
  todayESPN,
} from "../../lib/dates";
import { getPeriodLabel } from "../../lib/game";
import ScoringTimeline from "./ScoringTimeline";
import BoxScore from "./BoxScore";
import RecentRecord from "./RecentRecord";
import PlayoffBracket from "./PlayoffBracket";
import Standings from "./Standings";
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
  const [playsExpanded, setPlaysExpanded] = useState(false);

  // Summary provides live-updating score/status/linescores. Polled here
  // while the game is live; ScoringTimeline and BoxScore read from the
  // same cache via their own useQuery calls with the same key.
  const { data: summary } = useQuery({
    queryKey: ["summary", eventId],
    queryFn: () => fetchGameSummary(eventId!),
    enabled: !!eventId,
    refetchInterval: (query) => {
      const state =
        query.state.data?.header?.competitions[0]?.status.type.state;
      return state === "in" ? 10_000 : false;
    },
  });

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
  const away = competition.competitors.find((c) => c.homeAway === "away")!;
  const home = competition.competitors.find((c) => c.homeAway === "home")!;

  const series = competition.series;
  const seriesLabel = series?.competitors?.length
    ? `(${series.competitors.find((c) => c.id === away.team.id)?.wins ?? 0}–${series.competitors.find((c) => c.id === home.team.id)?.wins ?? 0})`
    : null;

  // Prefer summary (polled while live) for score/status/linescores;
  // fall back to scoreboard for initial paint or if summary hasn't loaded.
  const summaryComp = summary?.header?.competitions[0];
  const summaryAway = summaryComp?.competitors.find(
    (c) => c.homeAway === "away",
  );
  const summaryHome = summaryComp?.competitors.find(
    (c) => c.homeAway === "home",
  );

  const status = summaryComp?.status ?? competition.status;
  const state = status.type.state;

  const awayScoreStr = summaryAway?.score ?? away.score;
  const homeScoreStr = summaryHome?.score ?? home.score;
  const awayScore = Number(awayScoreStr);
  const homeScore = Number(homeScoreStr);

  const awayWon = state === "post" && awayScore > homeScore;
  const homeWon = state === "post" && homeScore > awayScore;
  const showScores = state === "in" || state === "post";

  // Summary linescores are a simple array indexed by period-1; scoreboard
  // linescores include the period number explicitly.
  const awayLinescoreLen =
    summaryAway?.linescores?.length ?? away.linescores?.length ?? 0;
  const homeLinescoreLen =
    summaryHome?.linescores?.length ?? home.linescores?.length ?? 0;
  const maxPeriod = showScores
    ? Math.max(4, awayLinescoreLen, homeLinescoreLen)
    : 0;
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  const recentPlays =
    state === "in" && summary?.plays?.length
      ? summary.plays
          .filter((p) => p.text)
          .slice(-10)
          .reverse()
      : [];

  function getPeriodScore(competitor: EspnCompetitor, period: number): string {
    const summaryScores =
      competitor.homeAway === "away"
        ? summaryAway?.linescores
        : summaryHome?.linescores;
    if (summaryScores) return summaryScores[period - 1]?.displayValue ?? "–";
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
                  {awayScoreStr}
                </span>
                <span className={styles.matchupDash}>–</span>
                <span
                  className={
                    homeWon ? styles.matchupScoreWin : styles.matchupScore
                  }
                >
                  {homeScoreStr}
                </span>
              </div>
            )}
            {seriesLabel && (
              <span className={styles.matchupSeries}>{seriesLabel}</span>
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
        {/* Last 5 games (pre-game only) */}
        {state === "pre" && event.season && (
          <div className={styles.gamePageCard}>
            <RecentRecord
              awayTeam={away.team}
              homeTeam={home.team}
              seasonYear={event.season.year}
            />
          </div>
        )}

        {/* Recent plays (live only) */}
        {recentPlays.length > 0 && (
          <div
            className={styles.gamePageCard}
            onClick={() => setPlaysExpanded((v) => !v)}
          >
            <div className={styles.recentPlays}>
              {(playsExpanded ? recentPlays : recentPlays.slice(0, 1)).map(
                (play, i) => (
                  <div
                    key={play.id ?? i}
                    className={styles.playItem}
                  >
                    <div className={styles.playMeta}>
                      {i === 0 && (
                        <span className={styles.playLive}>Live</span>
                      )}
                      <span>
                        {getPeriodLabel(play.period.number)} ·{" "}
                        {play.clock.displayValue}
                      </span>
                    </div>
                    <div className={styles.playText}>{play.text}</div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

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
                          {competitor.homeAway === "away"
                            ? awayScoreStr
                            : homeScoreStr}
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

        {/* Standings or Playoff Bracket */}
        {summary?.header?.season?.type === 3 ? (
          <div className={styles.gamePageCard}>
            <PlayoffBracket
              awayTeamId={away.team.id}
              homeTeamId={home.team.id}
              seasonYear={event.season?.year ?? new Date().getFullYear()}
            />
          </div>
        ) : (
          <div className={styles.gamePageCard}>
            <Standings
              awayTeamId={away.team.id}
              homeTeamId={home.team.id}
              isSameConference={summary?.standings?.isSameConference}
            />
          </div>
        )}
      </div>
    </div>
  );
}
