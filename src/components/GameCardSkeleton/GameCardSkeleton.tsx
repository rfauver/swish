import styles from "./GameCardSkeleton.module.css";

export default function GameCardSkeleton() {
  return (
    <div className={styles.row} aria-hidden="true">
      <div className={styles.teamAway}>
        <div className={`${styles.shimmer} ${styles.badge}`} />
        <div className={`${styles.shimmer} ${styles.name}`} />
        <div className={`${styles.shimmer} ${styles.logo}`} />
      </div>
      <div className={styles.center}>
        <div className={`${styles.shimmer} ${styles.score}`} />
      </div>
      <div className={styles.teamHome}>
        <div className={`${styles.shimmer} ${styles.logo}`} />
        <div className={`${styles.shimmer} ${styles.name}`} />
      </div>
    </div>
  );
}
