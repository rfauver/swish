import { espnFetch } from "./espn";

// --- Raw ESPN types ---

export interface EspnTeam {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  location: string;
  name: string;
  color: string;
  alternateColor: string;
  logo: string;
}

export interface EspnCompetitor {
  id: string;
  homeAway: "home" | "away";
  score: string;
  team: EspnTeam;
  linescores: Array<{
    value: number;
    displayValue: string;
    period: number;
  }>;
}

export type GameState = "pre" | "in" | "post";

export interface EspnStatus {
  clock: number;
  displayClock: string;
  period: number;
  type: {
    id: string;
    name: string;
    state: GameState;
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
}

export interface EspnBroadcast {
  market: string;
  names: string[];
}

export interface EspnVenue {
  id: string;
  fullName: string;
  address: {
    city: string;
    state: string;
  };
}

export interface EspnSeriesCompetitor {
  id: string;
  wins: number;
}

export interface EspnSeries {
  type: string;
  summary: string;
  competitors: EspnSeriesCompetitor[];
}

export interface EspnNote {
  type: string;
  headline: string;
}

export interface EspnCompetition {
  id: string;
  date: string;
  venue: EspnVenue;
  competitors: EspnCompetitor[];
  status: EspnStatus;
  broadcasts: EspnBroadcast[];
  series?: EspnSeries;
  notes?: EspnNote[];
}

export interface EspnEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  competitions: [EspnCompetition];
  season?: {
    year: number;
    type: number;
  };
}

export interface ScoreboardResponse {
  events: EspnEvent[];
}

// --- Fetcher ---

/** Fetch scores for a given date (YYYYMMDD). Defaults to today. */
export async function fetchScoreboard(
  date?: string,
): Promise<ScoreboardResponse> {
  const params = date ? { dates: date } : undefined;
  return espnFetch<ScoreboardResponse>("/scoreboard", params);
}
