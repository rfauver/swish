import { espnFetch } from "./espn";

export interface ScheduleCompetitor {
  id: string;
  homeAway: "home" | "away";
  winner?: boolean;
  score?: { displayValue: string };
  team: {
    id: string;
    abbreviation: string;
    displayName: string;
    logos?: Array<{ href: string }>;
  };
}

export interface ScheduleEvent {
  id: string;
  date: string;
  competitions: Array<{
    competitors: ScheduleCompetitor[];
    status: {
      type: {
        completed: boolean;
      };
    };
  }>;
}

export interface ScheduleResponse {
  events: ScheduleEvent[];
}

export async function fetchTeamSchedule(
  teamId: string,
  season: number,
  seasonType: number,
): Promise<ScheduleResponse> {
  return espnFetch<ScheduleResponse>(`/teams/${teamId}/schedule`, {
    season: String(season),
    seasontype: String(seasonType),
  });
}
