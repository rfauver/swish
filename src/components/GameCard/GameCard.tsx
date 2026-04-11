import { Link } from "react-router-dom";
import type { EspnCompetitor, EspnEvent } from "../../api/scores";
import { formatGameTime } from "../../lib/dates";
import { getPeriodLabel } from "../../lib/game";
import styles from "./GameCard.module.css";

interface GameCardProps {
  event: EspnEvent;
  date: string;
}

function getCompetitor(
  event: EspnEvent,
  side: "home" | "away",
): EspnCompetitor {
  return event.competitions[0].competitors.find((c) => c.homeAway === side)!;
}

function StatusBadge({ event }: { event: EspnEvent }) {
  const { status } = event.competitions[0];
  const { state } = status.type;

  if (state === "post") {
    return (
      <div className={`${styles.badge} ${styles.badgeFinal}`}>
        {status.type.shortDetail}
      </div>
    );
  }

  if (state === "in") {
    return (
      <div className={`${styles.badge} ${styles.badgeLive}`}>
        {getPeriodLabel(status.period)} - {status.displayClock}
      </div>
    );
  }

  // pre-game: empty placeholder keeps column width consistent
  return <div className={styles.badgeEmpty} />;
}

export default function GameCard({ event, date }: GameCardProps) {
  const competition = event.competitions[0];
  const { status } = competition;
  const state = status.type.state;
  const away = getCompetitor(event, "away");
  const home = getCompetitor(event, "home");

  const showScores = state === "in" || state === "post";
  const awayWon = state === "post" && Number(away.score) > Number(home.score);
  const homeWon = state === "post" && Number(home.score) > Number(away.score);

  return (
    <Link to={`/game/${event.id}?date=${date}`} className={styles.link}>
    <article className={styles.row}>
      {/* Away team: badge on far left, name, logo toward center */}
      <div className={styles.teamAway}>
        <StatusBadge event={event} />
        <span className={`${styles.name} ${awayWon ? styles.nameWin : ""}`}>
          {away.team.displayName}
        </span>
        <img
          src={away.team.logo}
          alt={away.team.displayName}
          className={styles.logo}
          width={28}
          height={28}
        />
      </div>

      {/* Center: scores or tip-off time */}
      <div className={styles.center}>
        {showScores ? (
          <div className={styles.scores}>
            <span className={awayWon ? styles.scoreWin : styles.score}>
              {away.score}
            </span>
            <span className={styles.scoreDash}>–</span>
            <span className={homeWon ? styles.scoreWin : styles.score}>
              {home.score}
            </span>
          </div>
        ) : (
          <div className={styles.time}>{formatGameTime(event.date)}</div>
        )}
      </div>

      {/* Home team: logo toward center, name on right */}
      <div className={styles.teamHome}>
        <img
          src={home.team.logo}
          alt={home.team.displayName}
          className={styles.logo}
          width={28}
          height={28}
        />
        <span className={`${styles.name} ${homeWon ? styles.nameWin : ""}`}>
          {home.team.displayName}
        </span>
      </div>
    </article>
    </Link>
  );
}
