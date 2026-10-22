# Sreverseai

A free learning website for Site Reliability Engineering, for beginners and experienced IT engineers.
It combines short lessons with hands-on games. Everything runs client-side, so `dist/` can go on any static or shared host.

```
npm install
npm run dev      # http://localhost:5173
npm test         # game engine, levels and site content tests (Vitest)
npm run build    # static output in dist/
```

## Site map

| URL | Page |
| --- | --- |
| `/` | Home |
| `/learn`, `/learn/:slug` | Lessons in two tracks: SRE Foundations (beginner) and Production SRE (experienced) |
| `/glossary` | Searchable SRE glossary |
| `/about` | About, privacy, trademarks |
| `/games` | Games hub (the **Games** button in the header) |
| `/games/grafana/*` | Grafana Learning Games: overview, campaign, Practice Arena, game screens |

## Layout

| Path | What |
| --- | --- |
| `src/site/` | The Sreverseai website: layout (header, footer), pages, lesson and glossary content |
| `src/site/content/lessons.ts` | All lessons. Add a lesson by adding an object; tests check links and slugs. |
| `src/games/registry.ts` | List of games. The Games hub, router and home page read from it. |
| `src/games/grafana/` | Grafana Learning Games: PromQL engine, simulator, levels, UI and tests |

## Adding a new game

1. Build it under `src/games/<slug>/`, with a default-exported component that holds its own `<Routes>` (see `src/games/grafana/GrafanaGame.tsx`).
2. In `src/games/registry.ts`, set the entry's `status` to `'live'` and add `component: lazy(() => import('./<slug>/<Game>'))`.
   Add a `fullscreen` regex if some screens should hide the site header.
3. It appears in the Games hub and is mounted at `/games/<slug>/*` automatically.

## Grafana Learning Games

- `src/games/grafana/engine/`: seeded metrics simulator, a PromQL parser and evaluator, the validator (compares query results, not text) and scoring.
- `src/games/grafana/levels/`: campaign levels (`index.json` + one JSON file per level) and `practice/` challenges.
- Adding a level or challenge: add the JSON, reference it in the index, and add a right and a wrong answer in `src/games/grafana/tests/`.

## Deploy

`.github/workflows/deploy.yml` tests, builds and uploads `dist/` over FTPS on every push to `main`.
It needs the repo secrets `FTP_SERVER`, `FTP_USERNAME` and `FTP_PASSWORD`. `public/.htaccess` forces HTTPS and rewrites SPA routes.

Product names such as Grafana, Prometheus and Kubernetes are trademarks of their owners. Sreverseai is not affiliated with or endorsed by them.
