import { espnFetch } from "./espn";
import type { ScoreboardResponse } from "./scores";
import type { League } from "../lib/league";

export async function fetchPlayoffScoreboard(
  league: League,
  year: number,
): Promise<ScoreboardResponse> {
  // NBA playoffs run Apr–Jun; WNBA playoffs run ~Sept–Oct.
  const dates =
    league === "wnba"
      ? `${year}0901-${year}1031`
      : `${year}0415-${year}0630`;
  return espnFetch<ScoreboardResponse>(
    "/scoreboard",
    { dates, limit: "200" },
    { league },
  );
}
