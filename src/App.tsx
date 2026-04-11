import { useQuery } from "@tanstack/react-query";
import GameCard from "./components/GameCard";
import { fetchScoreboard } from "./api/scores";

function App() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["scoreboard"],
    queryFn: () => fetchScoreboard(),
  });

  return (
    <div
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      <h2
        style={{
          color: "var(--color-text)",
          fontFamily: "var(--font-sans)",
          margin: "0 0 8px",
        }}
      >
        Today
      </h2>
      {isPending && (
        <p style={{ color: "var(--color-text-secondary)" }}>Loading…</p>
      )}
      {isError && (
        <p style={{ color: "var(--color-live)" }}>Failed to load scores.</p>
      )}
      {data?.events.map((event) => (
        <GameCard key={event.id} event={event} />
      ))}
    </div>
  );
}

export default App;
