import { espnFetch } from "./espn";
import type { EspnEvent, ScoreboardResponse } from "./scores";
import type { League } from "../lib/league";

const PLAYOFF_MONTHS: Record<League, string[]> = {
  nba: ["04", "05", "06"],
  wnba: ["09", "10", "11"],
};

export async function fetchPlayoffScoreboard(
  league: League,
  year: number,
): Promise<ScoreboardResponse> {
  const boards = await Promise.all(
    PLAYOFF_MONTHS[league].map((month) =>
      espnFetch<ScoreboardResponse>(
        "/scoreboard",
        { dates: `${year}${month}`, limit: "500" },
        { league },
      ),
    ),
  );

  const seen = new Set<string>();
  const events: EspnEvent[] = [];
  for (const board of boards) {
    for (const event of board.events) {
      if (!seen.has(event.id)) {
        seen.add(event.id);
        events.push(event);
      }
    }
  }
  return { ...boards[0], events };
}
