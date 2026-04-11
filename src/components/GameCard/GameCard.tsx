import type { EspnCompetitor, EspnEvent, GameState } from "../../api/scores";
import styles from "./GameCard.module.css";

interface GameCardProps {
  event: EspnEvent;
}

function getCompetitor(
  event: EspnEvent,
  side: "home" | "away",
): EspnCompetitor {
  return event.competitions[0].competitors.find((c) => c.homeAway === side)!;
}

function StatusLabel({
  shortDetail,
  state,
}: {
  shortDetail: string;
  state: GameState;
}) {
  if (state === "in") {
    return (
      <span className={styles.status}>
        <span className={styles.liveDot} aria-hidden="true" />
        {shortDetail}
      </span>
    );
  }
  return <span className={styles.status}>{shortDetail}</span>;
}

export default function GameCard({ event }: GameCardProps) {
  const competition = event.competitions[0];
  const { status } = competition;
  const state = status.type.state;
  const away = getCompetitor(event, "away");
  const home = getCompetitor(event, "home");

  const showScores = state === "in" || state === "post";
  const awayWon = state === "post" && Number(away.score) > Number(home.score);
  const homeWon = state === "post" && Number(home.score) > Number(away.score);

  return (
    <article className={styles.card}>
      <div className={styles.teams}>
        <Team competitor={away} leader={awayWon} side="away" />
        <div className={styles.center}>
          {showScores ? (
            <div className={styles.scores}>
              <span className={awayWon ? styles.scoreWin : styles.score}>
                {away.score}
              </span>
              <span className={styles.scoreDivider}>–</span>
              <span className={homeWon ? styles.scoreWin : styles.score}>
                {home.score}
              </span>
            </div>
          ) : (
            <div className={styles.tipoff}>{status.type.shortDetail}</div>
          )}
          {showScores && (
            <StatusLabel shortDetail={status.type.shortDetail} state={state} />
          )}
        </div>
        <Team competitor={home} leader={homeWon} side="home" />
      </div>
    </article>
  );
}

function Team({
  competitor,
  leader,
  side,
}: {
  competitor: EspnCompetitor;
  leader: boolean;
  side: "home" | "away";
}) {
  const { team } = competitor;
  return (
    <div
      className={`${styles.team} ${side === "home" ? styles.teamHome : styles.teamAway}`}
    >
      <img
        src={team.logo}
        alt={team.displayName}
        className={styles.logo}
        width={40}
        height={40}
      />
      <span className={`${styles.abbr} ${leader ? styles.abbrWin : ""}`}>
        {team.abbreviation}
      </span>
    </div>
  );
}
