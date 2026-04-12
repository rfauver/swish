import { useQuery } from "@tanstack/react-query";
import type { BoxscoreAthlete, BoxscoreTeamPlayers } from "../../api/summary";
import { fetchGameSummary } from "../../api/summary";
import styles from "./BoxScore.module.css";

interface Props {
  eventId: string;
  isLive: boolean;
}

// Stat column indices into BoxscoreAthlete.stats (NBA layout):
// ["MIN","PTS","FG","3PT","FT","REB","AST","TO","STL","BLK","OREB","DREB","PF","+/-"]
const IDX = {
  MIN: 0,
  PTS: 1,
  FG: 2,
  REB: 5,
  AST: 6,
  PLUS_MINUS: 13,
} as const;

function parseFgPct(fg: string | undefined): string {
  if (!fg) return "–";
  const [madeStr, attStr] = fg.split("-");
  const made = Number(madeStr);
  const att = Number(attStr);
  if (!Number.isFinite(made) || !Number.isFinite(att) || att === 0) return "–";
  return `${Math.round((made / att) * 100)}%`;
}

function statAt(athlete: BoxscoreAthlete, i: number): string {
  return athlete.stats?.[i] ?? "–";
}

function TeamTable({ team }: { team: BoxscoreTeamPlayers }) {
  const stats = team.statistics?.[0];
  if (!stats) return null;

  const athletes = stats.athletes.filter((a) => !a.didNotPlay);
  if (athletes.length === 0) return null;

  return (
    <div className={styles.teamBlock}>
      <div className={styles.teamHeader}>
        {team.team.logo && (
          <img
            src={team.team.logo}
            alt={team.team.abbreviation}
            width={20}
            height={20}
            className={styles.teamLogo}
          />
        )}
        <span>{team.team.displayName}</span>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.playerCell}>Player</th>
              <th>MIN</th>
              <th>PTS</th>
              <th>FG%</th>
              <th>AST</th>
              <th>REB</th>
              <th>+/-</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((a) => (
              <tr key={a.athlete.id}>
                <td className={styles.playerCell}>
                  <span className={styles.playerName}>
                    {a.athlete.shortName}
                  </span>
                  {a.starter && <span className={styles.starter}>•</span>}
                </td>
                <td>{statAt(a, IDX.MIN)}</td>
                <td>{statAt(a, IDX.PTS)}</td>
                <td>{parseFgPct(a.stats?.[IDX.FG])}</td>
                <td>{statAt(a, IDX.AST)}</td>
                <td>{statAt(a, IDX.REB)}</td>
                <td>{statAt(a, IDX.PLUS_MINUS)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BoxScore({ eventId, isLive }: Props) {
  const { data } = useQuery({
    queryKey: ["summary", eventId],
    queryFn: () => fetchGameSummary(eventId),
    refetchInterval: isLive ? 30_000 : false,
  });

  const players = data?.boxscore?.players;
  if (!players || players.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      {players.map((team) => (
        <TeamTable key={team.team.id} team={team} />
      ))}
    </div>
  );
}
