import type { League } from "../../lib/league";
import styles from "./LeagueToggle.module.css";

interface Props {
  league: League;
  onToggle: () => void;
}

// Official league logos, served from the same ESPN CDN the app already uses
// (and CacheFirst-caches) for team logos.
const LOGO_URL: Record<League, string> = {
  nba: "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png",
  wnba: "https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png",
};

/**
 * Floating action button that shows the current league's logo and flips to the
 * other league on tap. Controlled: parent owns the league state (see useLeague).
 */
export default function LeagueToggle({ league, onToggle }: Props) {
  const other = league === "nba" ? "WNBA" : "NBA";
  return (
    <button
      type="button"
      className={styles.fab}
      onClick={onToggle}
      aria-label={`Switch to ${other}`}
      title={`Switch to ${other}`}
    >
      <img
        className={styles.logo}
        src={LOGO_URL[league]}
        alt={league.toUpperCase()}
        width={48}
        height={48}
      />
    </button>
  );
}
