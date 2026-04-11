import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { fetchScoreboard } from "../../api/scores";
import GameCard from "../../components/GameCard";
import GameCardSkeleton from "../../components/GameCardSkeleton/GameCardSkeleton";
import DateNav from "../../components/DateNav/DateNav";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useSwipe } from "../../hooks/useSwipe";
import { addDays, fromESPNDate, todayESPN, toESPNDate } from "../../lib/dates";
import styles from "./Scoreboard.module.css";

// How often to re-fetch while games are in progress (ms)
const LIVE_REFETCH_INTERVAL = 30_000;

export default function Scoreboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get("date") ?? todayESPN();
  const isOnline = useOnlineStatus();

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ["scoreboard", date],
    queryFn: () => fetchScoreboard(date),
    // Poll every 30s only while any game is live
    refetchInterval: (query) => {
      const events = query.state.data?.events ?? [];
      const hasLiveGame = events.some(
        (e) => e.competitions[0].status.type.state === "in",
      );
      return hasLiveGame ? LIVE_REFETCH_INTERVAL : false;
    },
  });

  function handleDateChange(newDate: string) {
    setSearchParams(newDate === todayESPN() ? {} : { date: newDate });
  }

  const parsed = fromESPNDate(date);
  const swipeRef = useSwipe<HTMLDivElement>({
    onSwipeLeft: () => handleDateChange(toESPNDate(addDays(parsed, 1))),
    onSwipeRight: () => handleDateChange(toESPNDate(addDays(parsed, -1))),
  });

  const events = data?.events ?? [];
  const isEmpty = !isPending && !isError && isOnline && events.length === 0;
  // Hard error: fetch failed and there's nothing cached to show
  const showError = isError && events.length === 0;
  // Offline with cached data: navigator.onLine is false but SW served stale data
  const showOfflineBanner = !isOnline && events.length > 0;
  // Offline with no cache at all
  const showOfflineEmpty = !isOnline && events.length === 0;

  return (
    <div ref={swipeRef} className={styles.page}>
      <header className={styles.header}>
        <span className={styles.wordmark}>Swish</span>
        {isFetching && !isPending && isOnline && (
          <span className={styles.refreshing} aria-label="Refreshing" />
        )}
      </header>

      {showOfflineBanner && (
        <div className={styles.offlineBanner}>
          Offline — showing cached scores
        </div>
      )}

      <DateNav date={date} onChange={handleDateChange} />

      <main className={styles.list}>
        {isPending &&
          isOnline &&
          Array.from({ length: 6 }, (_, i) => <GameCardSkeleton key={i} />)}

        {(showError || showOfflineEmpty) && (
          <p className={styles.message}>
            {!isOnline
              ? "You're offline. Load the app online first to cache scores."
              : "Could not load scores. Check your connection."}
          </p>
        )}

        {isEmpty && <p className={styles.message}>No games scheduled.</p>}

        {events.map((event) => (
          <GameCard key={event.id} event={event} />
        ))}
      </main>
    </div>
  );
}
