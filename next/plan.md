# Sports Fiesta S9 Platform Implementation Plan

## 1. Goal

Build one Firebase-backed Sports Fiesta S9 tournament platform with three independently runnable clients:

- `next/`: public website, hidden organizer website, Firebase Functions, Firebase rules, and the canonical shared TypeScript domain packages.
- `expo-viewer/`: read-only iOS and Android app for spectators.
- `expo-organizer/`: authenticated iOS and Android app for scorers and tournament organizers.

No application source, workspace configuration, Firebase configuration, or generated build output will be added at the repository root. The existing `md/` source documents remain reference material only.

## 2. Product Rules

- Sports Fiesta S9 is the only tournament.
- Seed only the four real teams and finalized rosters from the approved roster specification.
- Do not seed mock fixtures, scores, events, results, player statistics, or awards.
- Before results exist, every standings view must show all four teams with zero values.
- Public clients are read-only and receive published Firestore projections in real time.
- Organizer mutations require authentication and go through callable Cloud Functions.
- Revision checks, idempotent command IDs, and Firestore transactions protect simultaneous score updates.
- Audit metadata remains internal. There is no public or organizer Audit Trail page.

## 3. Website

### Public routes

- `/`: compact tournament overview with live match priority, upcoming matches, zero-filled team standings, and event shortcuts.
- `/teams`: combined team standings and segmented contribution chart.
- `/football`, `/handball`, `/cricket`: live matches first, upcoming fixtures second, completed results last.
- `/football/[matchId]`, `/handball/[matchId]`: lineup, score, scorer/card feed, and result.
- `/cricket/[matchId]`: innings scorecard, ball progression, batter/bowler figures, extras, target, run rates, and result.
- `/players/[playerId]`: website-only football player profile and tournament totals.
- `/leaderboards`: top scorer, Orange Cap, Purple Cap, MVP, and team leaders.

The public shell uses a responsive Framer Motion top navbar inspired by the supplied component. It has Teams, Football, Handball, Cricket, theme toggle, and a mobile menu. Public pages never render organizer controls.

### Hidden organizer routes

- `/organizer/login`: organizer PIN exchange.
- `/organizer`: operational overview.
- `/organizer/matches`: create, schedule, set up, start, and score matches.
- `/organizer/matches/[matchId]`: sport-specific scoring console.
- `/organizer/teams`: edit team presentation, rosters, captains, and cricket roles.
- `/organizer/awards`: review and confirm generated awards.
- `/organizer/settings`: tournament metadata, venues, and placement points.

The organizer area uses the existing Shadcn sidebar architecture. It is intentionally absent from public navigation. Website sessions use Firebase ID tokens exchanged for secure HTTP-only cookies when server credentials are configured.

Obsolete `/dashboard/*` routes redirect to the closest public route. `/dashboard/audit-trail` returns `404`.

## 4. Expo Viewer

- Expo Router tabs: Teams, Football, Handball, Cricket.
- Teams: four zero-filled rows and a responsive stacked horizontal bar chart for football, handball, and cricket.
- Sport tabs: live matches first, upcoming second, completed last.
- Every fixture opens a detail screen. Upcoming fixtures show schedule and published lineups; live fixtures show real-time progression; completed fixtures show the full result or scorecard.
- Cricket detail includes every delivery, batting and bowling tables, extras, current run rate, target, required rate, and leaders.
- Viewer data subscribes to public Firestore projections and contains no mutation controls.

## 5. Expo Organizer

- Expo Router tabs: Home, Teams, Settings.
- Home: sport selector, match lists, fixture creation, match setup, and scoring entry points.
- Teams: editable roster, team color/logo metadata, captains, player role, batting style, and bowling style.
- Settings: S9 metadata, venues, five-over format, placement awards, and appearance.
- Scoring is disabled while offline or while the local revision is stale.

## 6. Scoring Domain

### Cricket

- Two innings, exactly five overs each unless all out or ended manually.
- Setup requires batting and bowling teams, lineups, striker, non-striker, and opening bowler.
- Runs: 0, 1, 2, 3, 4, 5, 6.
- Extras: wide, no-ball, bye, leg-bye, penalty, and dead ball.
- Dismissals: bowled, caught, LBW, run out, stumped, hit wicket, retired hurt, retired out, and obstructing the field.
- Wide, no-ball, and dead-ball deliveries do not consume a legal ball.
- No-ball activates a free hit; only dismissals legal on a free hit are accepted.
- Odd completed runs and completed overs rotate strike automatically.
- A bowler cannot bowl consecutive overs.
- Score, wickets, overs, extras, batter figures, bowler figures, run rate, target, required rate, result, and tournament leaders are derived from events.
- Undo removes only the latest delivery. Edit replaces one selected delivery and recalculates the innings from its initial setup.
- A tied match starts a one-over Super Over per team. A tied Super Over ends in `Resolution pending`.

### Football and handball

- Group fixtures and lineups are organizer-created.
- Events: goal, own goal, yellow card, red card, shootout goal, and shootout miss.
- Scores and player totals are event-derived; undo removes only the latest event.
- Group standings rank by wins, goal difference, then goals scored.
- A second/third tie after those values creates a decider.
- A tied final goes directly to best-of-five penalties, then sudden death.

### Overall standings and awards

- Default sport placement points: 10, 5, 3, 1; organizer-editable.
- Overall points are confirmed football, handball, and cricket placement points.
- Orange Cap, Purple Cap, top scorer, MVP, and match awards are calculated from accepted match events and published only when appropriate.

## 7. Firebase Contract

- Private source: `tournaments/sports-fiesta-s9/{teams,players,matches,awards,organizerSessions,commandReceipts}`.
- Match events: `tournaments/sports-fiesta-s9/matches/{matchId}/events`.
- Public projections: `publicTournaments/sports-fiesta-s9/{teams,players,matches,standings,leaderboards,awards}`.
- Public reads are allowed; public writes and all direct private client writes are denied.
- Callable commands validate organizer claims, `commandId`, and `expectedRevision`.
- Firebase client values come only from environment variables. Server credentials and organizer PIN hashes are never exposed through public environment variables.

## 8. Test-Driven Delivery

1. Add or update failing domain tests for cricket legality, strike changes, over changes, wickets, free hits, chase completion, edit/undo, field events, shootouts, standings, placement points, and awards.
2. Implement pure reducers and selectors until those tests pass.
3. Test Firestore rules, command idempotency, stale revision rejection, and public/private access against emulators.
4. Build public website views and verify route, empty, loading, error, mobile, and dark/light states.
5. Build organizer website workflows and verify authentication and scoring commands.
6. Build and typecheck both Expo clients; test shared selectors and key screens.
7. Run domain tests, Functions tests, lint, TypeScript, Next production build, Expo web exports, and browser checks at desktop and mobile widths.

## 9. Delivery Boundaries

- Firebase deployment and Vercel/EAS production deployment happen only after local tests and emulator checks pass and valid deployment credentials are available.
- Expo Go is the immediate device target; EAS preview profiles are included for later Android/iOS preview builds.
- Optional chart coordinates may be absent. Any coordinate-based view must show a truthful partial-data or empty state rather than fabricated information.
