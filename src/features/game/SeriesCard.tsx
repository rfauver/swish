import type { BracketSeries } from "../../lib/playoffs";
import styles from "./SeriesCard.module.css";

interface Props {
  series: BracketSeries;
  isHighlighted: boolean;
}

function TeamRow({
  team,
  wins,
  isWinner,
}: {
  team: { id: string; abbreviation: string; logo: string; name?: string } | null;
  wins: number;
  isWinner: boolean;
}) {
  if (!team) {
    return (
      <div className={styles.teamRow}>
        <div className={styles.logoPlaceholder} />
        <span className={styles.tbd}>TBD</span>
        <span className={styles.wins} />
      </div>
    );
  }

  return (
    <div className={`${styles.teamRow} ${isWinner ? styles.winner : ""}`}>
      <img
        src={team.logo}
        alt={team.abbreviation}
        className={styles.logo}
        width={20}
        height={20}
      />
      <span className={styles.name}>{team.name ?? team.abbreviation}</span>
      <span className={styles.wins}>{wins}</span>
    </div>
  );
}

export default function SeriesCard({ series, isHighlighted }: Props) {
  const [teamA, teamB] = series.teams;
  const [winsA, winsB] = series.wins;
  const aWon = series.completed && winsA > winsB;
  const bWon = series.completed && winsB > winsA;

  return (
    <div
      className={`${styles.card} ${isHighlighted ? styles.highlighted : ""}`}
    >
      <TeamRow team={teamA} wins={winsA} isWinner={aWon} />
      <TeamRow team={teamB} wins={winsB} isWinner={bWon} />
    </div>
  );
}
