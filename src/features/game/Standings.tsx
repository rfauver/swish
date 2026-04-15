import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchStandings } from "../../api/standings";
import type { StandingsConference, StandingsEntry } from "../../api/standings";
import { fetchTeam } from "../../api/teams";
import styles from "./Standings.module.css";

interface Props {
  awayTeamId: string;
  homeTeamId: string;
  isSameConference?: boolean;
}

function getStat(entry: StandingsEntry, type: string): string {
  return entry.stats.find((s) => s.type === type)?.displayValue ?? "–";
}

function findConference(
  conferences: StandingsConference[],
  teamId: string,
): StandingsConference | undefined {
  return conferences.find((conf) =>
    conf.standings.entries.some((e) => e.team.id === teamId),
  );
}

export default function Standings({
  awayTeamId,
  homeTeamId,
  isSameConference,
}: Props) {
  const { data, isPending } = useQuery({
    queryKey: ["standings"],
    queryFn: fetchStandings,
    staleTime: 60 * 60 * 1000,
  });

  const conferences = data?.children ?? [];
  const awayConf = findConference(conferences, awayTeamId);
  const homeConf = findConference(conferences, homeTeamId);

  const conferencesToShow: StandingsConference[] = isSameConference
    ? awayConf
      ? [awayConf]
      : []
    : [awayConf, homeConf].filter(
        (c, i, arr): c is StandingsConference =>
          !!c && arr.findIndex((x) => x?.id === c.id) === i,
      );

  const teamIds = Array.from(
    new Set(
      conferencesToShow.flatMap((c) =>
        c.standings.entries.map((e) => e.team.id),
      ),
    ),
  );

  const teamQueries = useQueries({
    queries: teamIds.map((id) => ({
      queryKey: ["team", id],
      queryFn: () => fetchTeam(id),
      staleTime: 60 * 60 * 1000,
    })),
  });

  const nextOpponentLogoById = new Map<string, string | undefined>();
  teamQueries.forEach((q, i) => {
    const id = teamIds[i];
    const teamData = q.data?.team;
    const next = teamData?.nextEvent?.[0];
    const oppCompetitor = next?.competitions[0]?.competitors.find(
      (c) => c.team.id !== id,
    );
    const logo =
      oppCompetitor?.team.logos?.[0]?.href ?? oppCompetitor?.team.logo;
    nextOpponentLogoById.set(id, logo);
  });

  if (isPending) {
    return <div className={styles.loading}>Loading standings…</div>;
  }
  if (conferencesToShow.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      {conferencesToShow.map((conf) => (
        <div key={conf.id} className={styles.confBlock}>
          <div className={styles.confHeader}>{conf.name}</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.rankCell}>#</th>
                <th className={styles.teamCell}>Team</th>
                <th>W</th>
                <th>L</th>
                <th>GB</th>
                <th className={styles.nextCell}>Next</th>
              </tr>
            </thead>
            <tbody>
              {[...conf.standings.entries]
                .sort((a, b) => {
                  const sa = Number(getStat(a, "playoffseed"));
                  const sb = Number(getStat(b, "playoffseed"));
                  if (Number.isFinite(sa) && Number.isFinite(sb)) return sa - sb;
                  return Number(getStat(b, "wins")) - Number(getStat(a, "wins"));
                })
                .map((entry, idx) => {
                const isGameTeam =
                  entry.team.id === awayTeamId ||
                  entry.team.id === homeTeamId;
                const nextLogo = nextOpponentLogoById.get(entry.team.id);
                const teamLogo = entry.team.logos?.[0]?.href;
                const seed = getStat(entry, "playoffseed");
                return (
                  <tr
                    key={entry.team.id}
                    className={isGameTeam ? styles.highlight : undefined}
                  >
                    <td className={styles.rankCell}>
                      {seed !== "–" ? seed : idx + 1}
                    </td>
                    <td className={styles.teamCell}>
                      <div className={styles.teamCellInner}>
                        {teamLogo && (
                          <img
                            src={teamLogo}
                            alt={entry.team.abbreviation}
                            className={styles.teamLogo}
                            width={20}
                            height={20}
                          />
                        )}
                        <span>{entry.team.name}</span>
                      </div>
                    </td>
                    <td>{getStat(entry, "wins")}</td>
                    <td>{getStat(entry, "losses")}</td>
                    <td>{getStat(entry, "gamesbehind")}</td>
                    <td className={styles.nextCell}>
                      {nextLogo ? (
                        <img
                          src={nextLogo}
                          alt=""
                          className={styles.nextLogo}
                          width={20}
                          height={20}
                        />
                      ) : (
                        <span className={styles.nextDash}>–</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
