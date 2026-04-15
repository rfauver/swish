import { espnFetch } from "./espn";
import type { EspnStatus, GameState } from "./scores";

export type { GameState };

export interface SummaryPlay {
  id: string;
  sequenceNumber: string;
  scoringPlay: boolean;
  awayScore: number;
  homeScore: number;
  text?: string;
  period: {
    number: number;
    displayValue?: string; // "1st Quarter", "4th Quarter", "OT"
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

export interface HeaderCompetitor {
  id: string;
  homeAway: "home" | "away";
  score: string;
  winner?: boolean;
  linescores?: Array<{ displayValue: string }>;
}

export interface SummaryHeader {
  competitions: Array<{
    status: EspnStatus;
    competitors: HeaderCompetitor[];
  }>;
  season?: {
    type: number; // 1=pre, 2=regular, 3=post (playoffs)
  };
}

export interface SummaryStandings {
  isSameConference?: boolean;
}

export interface SummaryResponse {
  plays: SummaryPlay[];
  boxscore?: {
    players?: BoxscoreTeamPlayers[];
  };
  header?: SummaryHeader;
  standings?: SummaryStandings;
}

export async function fetchGameSummary(
  eventId: string,
): Promise<SummaryResponse> {
  return espnFetch<SummaryResponse>("/summary", { event: eventId });
}
