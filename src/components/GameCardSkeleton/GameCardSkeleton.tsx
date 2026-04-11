import styles from "./GameCardSkeleton.module.css";

export default function GameCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.row}>
        <div className={styles.team}>
          <div className={`${styles.shimmer} ${styles.logo}`} />
          <div className={`${styles.shimmer} ${styles.abbr}`} />
        </div>
        <div className={styles.center}>
          <div className={`${styles.shimmer} ${styles.score}`} />
          <div className={`${styles.shimmer} ${styles.status}`} />
        </div>
        <div className={`${styles.team} ${styles.teamRight}`}>
          <div className={`${styles.shimmer} ${styles.abbr}`} />
          <div className={`${styles.shimmer} ${styles.logo}`} />
        </div>
      </div>
    </div>
  );
}
