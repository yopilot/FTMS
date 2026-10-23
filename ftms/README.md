# FTMS · Football, live

A free football app that runs entirely in the browser: live scores from every competition ESPN covers, match centres with lineups and player ratings, league tables, squads, player profiles and news. It also has a **manager hub** where you sign in as the manager of a real club (or your own Sunday-league side) and run the team.

No backend, no accounts on a server, no API keys.

## Features

### Live football

- **Scores**: every match worldwide for any day, grouped by competition. Filter by Live, Finished or Upcoming, or by your followed teams and leagues. Live scores refresh on their own (15/30/60 s, set in Settings) and flash when a goal goes in.
- **Match centre**: score header, event timeline (goals, cards, subs), both line-ups on a pitch with formations, per-player match ratings, team stats, play-by-play commentary, league table and head-to-head.
- **Competitions**: 70+ leagues and cups, each with a table, matchday browser, top scorers and assists, and news.
- **Teams**: next match, recent form, current manager (with photo), squad with ratings, fixtures, results and news.
- **Players**: photo and bio, season stats by competition, last matches, a performance radar and an FTMS rating.
- **News**: top stories and per-league or per-team feeds.
- **Follow** teams and leagues with the star. They move to the top everywhere, and you get goal, kick-off and full-time alerts.
- **Search anything** with `Ctrl K` / `⌘K` or `/`.

### Manager hub (`/manager`)

- Pick a club from 15 leagues. The login screen shows each club's **current manager** from Wikidata.
- **Dugout**: next-match countdown with opponent form, matchday checklist, squad status, your XI, league position, top performers and club news.
- **Squad**: real squad and injuries. Set each player's status, morale and squad role, add private notes and transfer-list players. Each player opens a FIFA-style card.
- **Tactics**: drag-and-drop line-up builder (tap-to-place on phones) with 8 formations and auto-pick of the best XI. Players glide between positions when you change formation. It also covers bench, captain, vice-captain and set-piece takers; six tactical sliders with presets (Gegenpress, Tiki-taka, Counter-attack…); live team-strength bars; and assistant notes about how the plan suits your XI.
- **Fixtures**: fixture difficulty ratings and a game-plan notepad per match.
- **Scouting**: search any player in the world, get a scouting report with a rating and a comparison against your squad, and keep a prioritised shortlist.
- **Your own club** (the original FTMS features): add and rate players (six attributes), schedule matches, pick who's available, generate **random or balanced** teams (N teams of T, extras to the bench, guests allowed), drag players between teams, log results, record custom stats and see leaderboards.

Everything you decide as a manager is saved on the device. Export/import a backup in **Settings**.

## Manager password

Every manager uses the same password:

```text
ftms2026
```

Change it at build time with an environment variable:

```bash
VITE_MANAGER_PASSWORD="your-password" npm run build
```

> This is a convenience gate, not security. The app has no server, so the check runs in the browser and the value ships in the JavaScript bundle. Don't reuse a password you care about.

## Data sources

| Data | Source | Notes |
| --- | --- | --- |
| Scores, fixtures, line-ups, match stats, tables, squads, injuries, player stats, news, search | ESPN's public site APIs | No key needed. Called directly from the browser. |
| Current managers | [Wikidata](https://www.wikidata.org) (SPARQL) | ESPN's own coach data is out of date. Cached for 3 days. |
| Player and manager photos, short bios | Wikipedia REST API | Only accepted when Wikipedia describes the page as a footballer or manager. |

**Ratings are estimates.** ESPN publishes stats, not ratings, so FTMS computes:

- **Match ratings (3.0–10.0)** from goals, assists, shots, saves, cards, clean sheets and the result (`src/lib/ratings.js → matchRating`).
- **OVR (45–94)** from season output, starts, league strength, team position and age (`seasonOvr`).

The UI labels both as FTMS estimates. FTMS isn't affiliated with ESPN, any league or any club. These are unofficial public endpoints and could change without notice.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173/ftms/
npm run lint
npm run build      # outputs dist/
npm run deploy     # builds and publishes dist/ to GitHub Pages (gh-pages branch)
```

The app is served under `/ftms/` (see `base` in `vite.config.js`). `public/404.html` handles deep links on GitHub Pages.

## Project layout

```text
src/
  api/          ESPN client + normalisers, Wikidata/Wikipedia lookups, React Query hooks, league catalogue
  components/
    layout/     App shell: sidebar, top bar, mobile bottom nav, ⌘K palette, goal-alert watcher
    ui/         Buttons, tabs, modals, crests, skeletons, radar, badges
    match/      Score rows, live cards, date strip, match header, timeline, line-up pitch
    league/ news/ team/   Tables, leaders, news cards, fixtures, manager card
    manager/    Login, line-up pitch, FIFA card, dugout widgets, player controls
    club/       Custom-club team board, player/match/stat forms
  context/      Theme, settings, follows, manager session, toasts, club data
  lib/          Ratings engine, formations + auto-pick, team generator, dates, colours, formatting
  pages/        Home, Scores, Match centre, Competitions, League, Team, Player, News, Settings
  pages/manager Dugout, Squad, Tactics, Fixtures, Scouting (+ gate/layout)
  pages/club    Custom-club player, matches, match, team builder, stats
  db/ services/ IndexedDB (Dexie) for the custom club, backup/restore
  styles/       Design tokens (dark + light), base, components, layout, page styles
```

## Tech

React 19, React Router 7, TanStack Query (caching and live polling), Motion (animations), dnd-kit (drag and drop with touch support), Dexie (IndexedDB), lucide icons, Vite 8.
