import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30 seconds by default.
      // Individual queries can override (e.g. live scores use a shorter interval).
      staleTime: 30 * 1000,
      // Keep unused query data in cache for 5 minutes.
      gcTime: 5 * 60 * 1000,
      // Retry once on failure before surfacing an error.
      retry: 1,
    },
  },
});

// Persist the query cache to localStorage so data survives page reloads.
// Max age of 24 hours — stale cached data is fine for scores, schedules, etc.
export const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "swish-query-cache",
});
