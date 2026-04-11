/** Format a Date as YYYYMMDD for the ESPN API. */
export function toESPNDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/** Parse a YYYYMMDD string into a local Date. */
export function fromESPNDate(s: string): Date {
  return new Date(
    parseInt(s.slice(0, 4)),
    parseInt(s.slice(4, 6)) - 1,
    parseInt(s.slice(6, 8)),
  );
}

/** YYYYMMDD string for today in local time. */
export function todayESPN(): string {
  return toESPNDate(new Date());
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Human-readable label for a date: "Today", "Yesterday", or "Mon Apr 7". */
export function formatDateLabel(date: Date): string {
  const today = new Date();
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, addDays(today, -1))) return "Yesterday";
  if (isSameDay(date, addDays(today, 1))) return "Tomorrow";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
