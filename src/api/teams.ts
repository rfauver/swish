import { espnFetch } from "./espn";
import type { League } from "../lib/league";

export interface TeamNextEventCompetitor {
  homeAway: "home" | "away";
  team: {
    id: string;
    abbreviation: string;
    displayName: string;
    logos?: Array<{ href: string }>;
    logo?: string;
  };
}

export interface TeamNextEvent {
  id: string;
  date: string;
  competitions: Array<{
    competitors: TeamNextEventCompetitor[];
  }>;
}

export interface TeamResponse {
  team: {
    id: string;
    abbreviation: string;
    displayName: string;
    nextEvent?: TeamNextEvent[];
  };
}

export async function fetchTeam(
  league: League,
  teamId: string,
): Promise<TeamResponse> {
  return espnFetch<TeamResponse>(`/teams/${teamId}`, undefined, { league });
}
