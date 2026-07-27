import type { League } from "../lib/league";

const leagueBase = (league: League) =>
  `https://site.api.espn.com/apis/site/v2/sports/basketball/${league}`;

export class EspnApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "EspnApiError";
    this.status = status;
  }
}

export async function espnFetch<T>(
  path: string,
  params: Record<string, string> | undefined,
  options: { league: League; base?: string },
): Promise<T> {
  const url = new URL(`${options.base ?? leagueBase(options.league)}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value),
    );
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new EspnApiError(res.status, `ESPN API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
