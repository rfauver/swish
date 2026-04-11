/** Q1–Q4, OT, 2OT, … */
export function getPeriodLabel(period: number): string {
  if (period <= 4) return `Q${period}`;
  if (period === 5) return "OT";
  return `${period - 4}OT`;
}
