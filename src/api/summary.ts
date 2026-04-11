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

export interface SummaryResponse {
  plays: SummaryPlay[];
}

export async function fetchGameSummary(
  eventId: string,
): Promise<SummaryResponse> {
  return espnFetch<SummaryResponse>("/summary", { event: eventId });
}
