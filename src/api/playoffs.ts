import { espnFetch } from "./espn";
import type { ScoreboardResponse } from "./scores";

export async function fetchPlayoffScoreboard(
  year: number,
): Promise<ScoreboardResponse> {
  return espnFetch<ScoreboardResponse>("/scoreboard", {
    dates: `${year}0415-${year}0630`,
    limit: "200",
  });
}
