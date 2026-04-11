# Swish — Claude Context

Fast, mobile-first NBA scores PWA. The official NBA app is slow and cluttered — this prioritizes instant loading, offline support, and a clean UI. No backend; all data comes from public APIs.

## Tech stack

| Concern              | Choice                                                |
| -------------------- | ----------------------------------------------------- |
| Build tool           | Vite                                                  |
| Language             | TypeScript                                            |
| Styling              | CSS Modules (all components use `.module.css`)        |
| Data fetching        | TanStack Query v5                                     |
| Client state         | Zustand (not yet used; reserved for user preferences) |
| Routing              | React Router v6                                       |
| PWA / service worker | vite-plugin-pwa (Workbox)                             |
| Data source          | ESPN public API (no key required, CORS-enabled)       |

## API

ESPN's unofficial public API — no auth, works directly from the browser.

- Scoreboard: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`
- With date: `?dates=YYYYMMDD`

All ESPN types are in `src/api/scores.ts`. The base fetch wrapper (`src/api/espn.ts`) throws `EspnApiError` on non-OK responses.

## Caching strategy

| Data                             | Workbox handler                                                                     | TanStack staleTime |
| -------------------------------- | ----------------------------------------------------------------------------------- | ------------------ |
| ESPN API responses               | NetworkFirst, 10s timeout, 5min cache                                               | 30s                |
| ESPN image CDN (`a.espncdn.com`) | CacheFirst                                                                          | 30 days            |
| App shell (JS/CSS bundles)       | Precached by service worker                                                         | —                  |
| Query cache across sessions      | Persisted to localStorage via `@tanstack/query-sync-storage-persister`, 24h max age | —                  |

Live scores auto-refetch every 30s via `refetchInterval` — only when at least one game has `status.type.state === "in"`.

## PWA notes

- Service worker is **production-only**. It does not run in `npm run dev`.
- Test offline behavior with `npm run build && npx vite preview`.
- After rebuilding, clear site data in DevTools (Application → Storage → Clear site data) to force the new service worker to activate. Otherwise the old SW may still serve cached JS.
- Offline detection uses `navigator.onLine` (via `src/hooks/useOnlineStatus.ts`), not TanStack Query's `isPaused`. The service worker transparently serves cached ESPN responses, so TanStack Query never sees a failed fetch — `isPaused` stays false even when offline.

## Deployment

Deployed to GitHub Pages via `.github/workflows/deploy.yml`. Pushes to `main` trigger an automatic build and deploy.

- The Vite `base` option is set at build time via the `VITE_BASE_PATH` env var (e.g. `/swish/`). Locally it defaults to `/`.
- `BrowserRouter` uses `import.meta.env.BASE_URL` as its `basename` so router URLs don't double-prefix the subpath.
- GitHub repo Settings → Pages → Source must be set to **GitHub Actions** (one-time manual step).

## Project structure

```
src/
  api/
    espn.ts              # Base fetch wrapper + EspnApiError
    scores.ts            # Scoreboard types + fetchScoreboard()
  components/
    DateNav/             # ← Today → date picker (updates ?date= URL param)
    GameCard/            # Single game tile (pre/live/final states)
    GameCardSkeleton/    # Shimmer placeholder matching GameCard layout
  features/
    scoreboard/          # Main scoreboard page + CSS
  hooks/
    useOnlineStatus.ts   # navigator.onLine with online/offline event listeners
  lib/
    dates.ts             # toESPNDate, fromESPNDate, formatDateLabel, addDays
    queryClient.ts       # QueryClient instance + localStorage persister
  index.css              # CSS reset + design tokens (CSS custom properties)
  App.tsx                # React Router <Routes>
  main.tsx               # App entry: BrowserRouter + PersistQueryClientProvider
```

## CSS conventions

- All design tokens are CSS custom properties defined in `src/index.css` (`--color-*`, `--space-*`, `--radius-*`, `--font-*`).
- Every component has its own `.module.css` file. No global class names.
- Mobile-first. Desktop breakpoint at 700px (scoreboard goes 2-column grid).

## Key decisions

- **No login, no backend.** User preferences will live in localStorage via Zustand when added.
- **Date in URL params** (`?date=YYYYMMDD`), not component state — dates are bookmarkable and survive refresh.
- **Skeleton loading, not spinners.** `GameCardSkeleton` uses a shimmer animation and matches `GameCard`'s exact layout to avoid layout shift.
- **`npm run dev` cannot go offline.** Vite's dev server serves modules dynamically (HMR, transforms) — these can't be precached. Offline testing requires the production build.
- **SPA routing caveat.** Currently only `/` exists with search params, so GitHub Pages works without a 404 shim. If path-based routes are added (e.g. `/team/:id`), a `public/404.html` redirect will be needed.
