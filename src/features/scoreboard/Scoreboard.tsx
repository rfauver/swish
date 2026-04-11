import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { fetchScoreboard } from "../../api/scores";
import GameCard from "../../components/GameCard";
import GameCardSkeleton from "../../components/GameCardSkeleton/GameCardSkeleton";
import DateNav from "../../components/DateNav/DateNav";
import { todayESPN } from "../../lib/dates";
import styles from "./Scoreboard.module.css";

// How often to re-fetch while games are in progress (ms)
const LIVE_REFETCH_INTERVAL = 30_000;

export default function Scoreboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get("date") ?? todayESPN();

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

  const events = data?.events ?? [];
  const isEmpty = !isPending && !isError && events.length === 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.wordmark}>Swish</span>
        {isFetching && !isPending && (
          <span className={styles.refreshing} aria-label="Refreshing" />
        )}
      </header>

      <DateNav date={date} onChange={handleDateChange} />

      <main className={styles.list}>
        {isPending &&
          Array.from({ length: 6 }, (_, i) => <GameCardSkeleton key={i} />)}

        {isError && (
          <p className={styles.message}>
            Could not load scores. Check your connection.
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
