import type { EspnEvent } from "../api/scores";
import type { League } from "../lib/league";

export type Conference = "East" | "West";
export type RoundId = 1 | 2 | 3 | 4;

export interface BracketTeam {
  id: string;
  abbreviation: string;
  name: string;
  logo: string;
}

export interface BracketSeries {
  round: RoundId;
  conference: Conference | "Finals";
  teams: [BracketTeam | null, BracketTeam | null];
  wins: [number, number];
  completed: boolean;
  bracketPosition: number;
}

export interface Bracket {
  rounds: Map<RoundId, BracketSeries[]>;
  roundIds: RoundId[];
}

const ROUND_LABELS: Record<League, Partial<Record<RoundId, string>>> = {
  nba: { 1: "1st Round", 2: "Conf Semis", 3: "Conf Finals", 4: "Finals" },
  wnba: { 1: "First Round", 2: "Semifinals", 4: "Finals" },
};

const ROUND_IDS: Record<League, RoundId[]> = {
  nba: [1, 2, 3, 4],
  wnba: [1, 2, 4],
};

export function roundLabel(round: RoundId, league: League): string {
  return ROUND_LABELS[league][round] ?? ROUND_LABELS.nba[round] ?? "";
}

interface ParsedHeadline {
  conference: Conference | "Finals";
  round: RoundId;
}

function parseHeadline(headline: string): ParsedHeadline | null {
  if (/^(?:W?NBA\s+)?Finals\b/.test(headline)) {
    return { conference: "Finals", round: 4 };
  }
  const match = headline.match(
    /^(?:(East|West)\s+)?(?:W?NBA\s+)?(1st Round|First Round|Semifinals|Conf Semis|Conf Finals|Finals)\b/,
  );
  if (!match) return null;
  const conference = (match[1] ?? "East") as Conference;
  const roundStr = match[2];
  const round =
    roundStr === "1st Round" || roundStr === "First Round"
      ? 1
      : roundStr === "Semifinals" || roundStr === "Conf Semis"
        ? 2
        : 3;
  return { conference, round: round as RoundId };
}

function seriesKey(teamIds: string[]): string {
  return [...teamIds].sort().join("-");
}

export function buildBracket(events: EspnEvent[], league: League): Bracket {
  const playoffEvents = events.filter((e) => e.season?.type === 3);

  // Deduplicate: keep latest event per series for most current win counts.
  // Round is part of the key because scheduled future rounds all share the
  // same TBD team ids (-1/-2).
  const latestBySeriesKey = new Map<
    string,
    { event: EspnEvent; parsed: ParsedHeadline }
  >();

  for (const event of playoffEvents) {
    const comp = event.competitions[0];
    const notes = comp.notes ?? [];
    const headline = notes[0]?.headline ?? "";
    const parsed = parseHeadline(headline);
    if (!parsed) continue;

    const teamIds = comp.competitors.map((c) => c.team.id);
    const key = `${parsed.round}:${seriesKey(teamIds)}`;

    const existing = latestBySeriesKey.get(key);
    if (!existing || event.date > existing.event.date) {
      latestBySeriesKey.set(key, { event, parsed });
    }
  }

  // Build series from deduplicated events
  const seriesList: BracketSeries[] = [];
  for (const { event, parsed } of latestBySeriesKey.values()) {
    const comp = event.competitions[0];
    const espnSeries = comp.series;

    const teams = comp.competitors.map((c) =>
      Number(c.team.id) < 0
        ? null
        : {
            id: c.team.id,
            abbreviation: c.team.abbreviation,
            name: c.team.name,
            logo: c.team.logo,
          },
    ) as [BracketTeam | null, BracketTeam | null];

    const wins: [number, number] = [0, 0];
    if (espnSeries?.competitors) {
      for (let i = 0; i < 2; i++) {
        if (!teams[i]) continue;
        const sc = espnSeries.competitors.find((s) => s.id === teams[i]!.id);
        wins[i] = sc?.wins ?? 0;
      }
    }

    seriesList.push({
      round: parsed.round,
      conference: parsed.conference,
      teams,
      wins,
      completed: espnSeries?.completed ?? false,
      bracketPosition: -1, // assigned below
    });
  }

  // Assign bracket positions using feeder relationships.
  // A later-round series tells us which earlier-round series are paired:
  // R2[0] is fed by R1[0]+R1[1], R2[1] by R1[2]+R1[3], etc.
  function teamIds(s: BracketSeries): Set<string> {
    return new Set(s.teams.filter(Boolean).map((t) => t!.id));
  }

  function getConfSeries(round: RoundId, conf: Conference | "Finals") {
    return seriesList.filter((s) => s.round === round && s.conference === conf);
  }

  const byMinId = (a: BracketSeries, b: BracketSeries) => {
    const aMin = Math.min(...[...teamIds(a)].map(Number));
    const bMin = Math.min(...[...teamIds(b)].map(Number));
    return aMin - bMin;
  };

  if (league === "wnba") {
    // WNBA is a single overall-seeded bracket (4 → 2 → 1 series, no
    // conference split), so conferences from headlines are replaced with
    // pseudo-sides: East = top half of the bracket, West = bottom half.
    const r1 = seriesList.filter((s) => s.round === 1);
    const r2 = seriesList.filter((s) => s.round === 2);
    const finals = seriesList.filter((s) => s.round === 4);

    if (finals.length > 0) {
      finals[0].bracketPosition = 0;
      const finalsIds = teamIds(finals[0]);
      const r2a = r2.find((s) => s.teams.some((t) => t && finalsIds.has(t.id)));
      if (r2a) {
        r2a.bracketPosition = 0;
        const r2b = r2.find((s) => s !== r2a);
        if (r2b) r2b.bracketPosition = 1;
      }
    }

    const orderedR2 = [...r2].sort(
      (a, b) => a.bracketPosition - b.bracketPosition,
    );
    for (let i = 0; i < orderedR2.length; i++) {
      const r2Ids = teamIds(orderedR2[i]);
      const feeders = r1.filter((s) =>
        s.teams.some((t) => t && r2Ids.has(t.id)),
      );
      if (feeders.length === 2) {
        feeders.sort(byMinId);
        feeders[0].bracketPosition = i * 2;
        feeders[1].bracketPosition = i * 2 + 1;
      }
    }

    const fillUnassigned = (series: BracketSeries[]) => {
      const unassigned = series
        .filter((s) => s.bracketPosition < 0)
        .sort(byMinId);
      let slot = 0;
      for (const s of unassigned) {
        while (series.some((x) => x.bracketPosition === slot)) slot++;
        s.bracketPosition = slot++;
      }
    };
    fillUnassigned(r1);
    fillUnassigned(r2);

    for (const s of r1) s.conference = s.bracketPosition <= 1 ? "East" : "West";
    for (const s of r2)
      s.conference = s.bracketPosition === 0 ? "East" : "West";
  } else {
    for (const conf of ["East", "West"] as Conference[]) {
      const r1 = getConfSeries(1, conf);
      const r2 = getConfSeries(2, conf);
      const r3 = getConfSeries(3, conf);

      // Sort R2 by feeder from R3 (if available), else by min team ID
      if (r3.length > 0 && r2.length === 2) {
        const r3Ids = teamIds(r3[0]);
        const r2a = r2.find((s) => s.teams.some((t) => t && r3Ids.has(t.id)));
        if (r2a) {
          r2a.bracketPosition = 0;
          const r2b = r2.find((s) => s !== r2a)!;
          r2b.bracketPosition = 1;
        }
      }
      if (!r2.some((s) => s.bracketPosition > 0) && r2.length > 1) {
        r2.sort(byMinId);
        r2.forEach((s, i) => (s.bracketPosition = i));
      }

      // Assign R1 positions from R2 feeders
      let positioned = false;
      if (r2.length >= 2) {
        const sorted = [...r2].sort(
          (a, b) => a.bracketPosition - b.bracketPosition,
        );
        for (let ri = 0; ri < sorted.length; ri++) {
          const r2Ids = teamIds(sorted[ri]);
          const feeders = r1.filter((s) =>
            s.teams.some((t) => t && r2Ids.has(t.id)),
          );
          if (feeders.length === 2) {
            positioned = true;
            feeders.sort(byMinId);
            feeders[0].bracketPosition = ri * 2;
            feeders[1].bracketPosition = ri * 2 + 1;
          }
        }
      }
      if (!positioned) {
        r1.sort(byMinId);
        r1.forEach((s, i) => (s.bracketPosition = i));
      }

      if (r3.length > 0) r3[0].bracketPosition = 0;
    }

    // Finals
    const finals = getConfSeries(4, "Finals");
    if (finals.length > 0) finals[0].bracketPosition = 0;
  }

  // Build rounds map, filling TBD placeholders for missing rounds
  const rounds = new Map<RoundId, BracketSeries[]>();

  for (const roundId of [1, 2, 3, 4] as RoundId[]) {
    const roundSeries = seriesList.filter((s) => s.round === roundId);

    if (roundId === 4) {
      if (roundSeries.length === 0) {
        roundSeries.push({
          round: 4,
          conference: "Finals",
          teams: [null, null],
          wins: [0, 0],
          completed: false,
          bracketPosition: 0,
        });
      }
      rounds.set(roundId, roundSeries);
      continue;
    }

    // For each side, ensure the expected number of series exist
    const expectedPerSide: Record<RoundId, number> =
      league === "wnba"
        ? { 1: 2, 2: 1, 3: 0, 4: 1 }
        : { 1: 4, 2: 2, 3: 1, 4: 1 };
    const expectedCount = expectedPerSide[roundId];
    for (const conf of ["East", "West"] as Conference[]) {
      const confSeries = roundSeries.filter((s) => s.conference === conf);
      while (confSeries.length < expectedCount) {
        confSeries.push({
          round: roundId,
          conference: conf,
          teams: [null, null],
          wins: [0, 0],
          completed: false,
          bracketPosition: confSeries.length,
        });
        roundSeries.push(confSeries[confSeries.length - 1]);
      }
    }

    // Sort: East first by position, then West by position
    roundSeries.sort((a, b) => {
      const confOrder =
        a.conference === b.conference ? 0 : a.conference === "East" ? -1 : 1;
      return confOrder || a.bracketPosition - b.bracketPosition;
    });

    rounds.set(roundId, roundSeries);
  }

  return { rounds, roundIds: ROUND_IDS[league] };
}

export function findTeamRound(bracket: Bracket, teamId: string): RoundId {
  let found: RoundId = 1;
  for (const [roundId, series] of bracket.rounds) {
    for (const s of series) {
      if (s.teams.some((t) => t?.id === teamId)) {
        found = roundId;
      }
    }
  }
  return found;
}
