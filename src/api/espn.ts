const BASE_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

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
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
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
