import { espnFetch } from "./espn";

export interface StandingsStat {
  name: string;
  type: string;
  displayValue: string;
}

export interface StandingsEntry {
  team: {
    id: string;
    abbreviation: string;
    displayName: string;
    name: string;
    logos?: Array<{ href: string }>;
  };
  stats: StandingsStat[];
}

export interface StandingsConference {
  id: string;
  name: string; // e.g., "Eastern Conference"
  abbreviation: string;
  standings: {
    entries: StandingsEntry[];
  };
}

export interface StandingsResponse {
  children: StandingsConference[];
}

export async function fetchStandings(): Promise<StandingsResponse> {
  return espnFetch<StandingsResponse>("/standings", undefined, {
    base: "https://site.api.espn.com/apis/v2/sports/basketball/nba",
  });
}
