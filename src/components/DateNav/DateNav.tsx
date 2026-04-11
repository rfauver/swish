import {
  addDays,
  formatDateLabel,
  fromESPNDate,
  todayESPN,
  toESPNDate,
} from "../../lib/dates";
import styles from "./DateNav.module.css";

interface DateNavProps {
  date: string; // YYYYMMDD
  onChange: (date: string) => void;
}

export default function DateNav({ date, onChange }: DateNavProps) {
  const parsed = fromESPNDate(date);
  const isToday = date === todayESPN();

  return (
    <nav className={styles.nav} aria-label="Date navigation">
      <button
        className={styles.arrow}
        onClick={() => onChange(toESPNDate(addDays(parsed, -1)))}
        aria-label="Previous day"
      >
        ‹
      </button>

      <button
        className={`${styles.label} ${isToday ? styles.labelToday : ""}`}
        onClick={() => !isToday && onChange(todayESPN())}
        aria-label={isToday ? "Current date" : "Go to today"}
        aria-current={isToday ? "date" : undefined}
      >
        {formatDateLabel(parsed)}
      </button>

      <button
        className={styles.arrow}
        onClick={() => onChange(toESPNDate(addDays(parsed, 1)))}
        aria-label="Next day"
      >
        ›
      </button>
    </nav>
  );
}
