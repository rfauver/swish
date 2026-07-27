import { create } from "zustand";
import { persist } from "zustand/middleware";

export type League = "nba" | "wnba";

interface LeagueState {
  league: League;
  setLeague: (league: League) => void;
  toggleLeague: () => void;
}

// Persisted to its own localStorage key, separate from the query cache
// ("swish-query-cache"). Zustand stores are module-level, so no provider
// is needed in main.tsx.
const useLeagueStore = create<LeagueState>()(
  persist(
    (set) => ({
      league: "nba",
      setLeague: (league) => set({ league }),
      toggleLeague: () =>
        set((state) => ({
          league: state.league === "nba" ? "wnba" : "nba",
        })),
    }),
    { name: "swish-preferences" },
  ),
);

/** Current league. Include this in query keys so NBA/WNBA caches never collide. */
export function useLeague(): League {
  return useLeagueStore((s) => s.league);
}

/** Flip between NBA and WNBA. */
export function useToggleLeague(): () => void {
  return useLeagueStore((s) => s.toggleLeague);
}
