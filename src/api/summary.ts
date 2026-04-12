import { espnFetch } from "./espn";

export interface SummaryPlay {
  id: string;
  sequenceNumber: string;
  scoringPlay: boolean;
  awayScore: number;
  homeScore: number;
  period: {
    number: number;
  };
  clock: {
    displayValue: string; // "12:00", "4:31"
  };
}

export interface BoxscoreAthlete {
  active: boolean;
  starter: boolean;
  didNotPlay: boolean;
  reason?: string;
  ejected: boolean;
  athlete: {
    id: string;
    displayName: string;
    shortName: string;
    jersey?: string;
    position?: { abbreviation: string };
  };
  // Stats indexed by the parent statistics.keys array. For NBA:
  // ["MIN","PTS","FG","3PT","FT","REB","AST","TO","STL","BLK","OREB","DREB","PF","+/-"]
  stats: string[];
}

export interface BoxscoreTeamStatistics {
  labels: string[];
  keys: string[];
  athletes: BoxscoreAthlete[];
}

export interface BoxscoreTeamPlayers {
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    logo?: string;
    color?: string;
  };
  statistics: BoxscoreTeamStatistics[];
}

export interface SummaryResponse {
  plays: SummaryPlay[];
  boxscore?: {
    players?: BoxscoreTeamPlayers[];
  };
}

export async function fetchGameSummary(
  eventId: string,
): Promise<SummaryResponse> {
  return espnFetch<SummaryResponse>("/summary", { event: eventId });
}
