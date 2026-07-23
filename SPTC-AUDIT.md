# SPTC — Pre-Game Audit Report

> Comprehensive review of logic bugs, responsiveness gaps, data integrity risks, and UX issues that could surface on game day.

---

## 1. CRITICAL — Data Integrity & Logic Bugs

### 1.1 Throwball: Single-Set Locked (no multi-set support)

- **Files:** `packages/domain/src/throwball.ts:77-79`, `:114-126`
- **Issue:** `getMatchWinner()` checks only `sets[0]`. `applyRallyToState()` never creates a new set when the current set completes. Throwball matches are hard-coded to single-set only — a best-of-3 or best-of-5 format **cannot be recorded**. If someone tries to play a multi-set match, the system will silently fail to advance.
- **Risk:** Game-day organizers expecting multi-set throwball will be blocked mid-match.

### 1.2 Lexical Match Number Sorting → Wrong Fixture Order

- **File:** `components/home-view.tsx:35,41` (also `components/sport-view.tsx:37`)
- **Issue:** Uses `localeCompare()` for match numbers. This sorts `M10` **before** `M2` (lexical order), completely scrambling fixture display order on the home page and sport pages.
- **Risk:** Confusion on game day — "where's the next match?" / "what time do we play?"

### 1.3 `createFieldMatch` Allows Empty-String Team ID

- **File:** `packages/domain/src/field-sports.ts:11`
- **Issue:** If `awayTeamId` is undefined/null, it silently defaults to `""`. A match with `["TeamA", ""]` is created. No error thrown.
- **Risk:** A corrupted match can be created and scored against an empty-string team.

### 1.4 Undo Field Event Resets Shootout Toss Unconditionally

- **File:** `packages/domain/src/field-sports.ts:126`
- **Issue:** Undoing **any** event (even a non-shootout goal) sets `tossWinnerTeamId` to `null`. If the toss was resolved and then an earlier goal is undone, the toss resolution is silently lost.
- **Risk:** Match state becomes inconsistent — shootout may be past the toss phase but the system thinks the toss hasn't happened.

### 1.5 Cricket Delivery Ball Number: Illegal Deliveries Get Duplicate Indices

- **File:** `packages/domain/src/cricket.ts:204`
- **Issue:** N balls and wides don't increment `legalBalls`, so they get the same ball number as the previous legal delivery. The `events` array has duplicate `{over, ball}` pairs, breaking uniqueness invariants.
- **Risk:** Ball-by-ball progression display may show duplicate ball numbers. Event lookup/filtering by position may misfire.

### 1.6 `extraRuns` API Contract Ambiguous

- **File:** `packages/domain/src/cricket.ts:146-148,162-164`
- **Issue:** `extraRuns` in `CricketDeliveryInput` is undocumented — is it *total extras including penalty* or *bonus beyond penalty*? The functions `runsForDelivery` and `completedRunsForStrike` assume "total including penalty" but callers may pass "bonus only", which would undercount runs.
- **Risk:** Incorrect scoring if the wrong convention is used by the organizer scoring UI.

### 1.7 `setNextBatter` Skips Validation in Over-End Path

- **File:** `packages/domain/src/cricket.ts:377-387`
- **Issue:** When `overEnded && state.nonStrikerId` is true, the new non-striker (`playerId`) is assigned **without** checking it's in the batting lineup. The `assertRosterSnapshotMember` call only happens in the else-branch.
- **Risk:** An invalid player can be inserted as non-striker, corrupting the innings state.

---

## 2. HIGH — Responsiveness & Layout Problems

### 2.1 Mobile Nav Menu Edge-to-Edge on Narrow Screens

- **File:** `components/public-navbar.tsx:82`
- **Issue:** The mobile dropdown menu uses `p-2` with no horizontal constraints. On 320px-wide devices, text touches screen edges. Missing `mx-2` or safe area padding.
- **Risk:** Unreadable navigation on small phones.

### 2.2 Match Card Scoreboard May Overflow

- **File:** `components/match-card.tsx:33`
- **Issue:** Three-column grid with `1fr auto 1fr`. Long team names + a cricket score like `120/3 (15.2)` can overflow or push the VS badge to wrap.
- **Risk:** Scoreboard breaks visually on small viewports.

### 2.3 Loading Skeleton Visible Alongside Real Data

- **File:** `components/home-view.tsx:106` (also `components/sport-view.tsx:52`)
- **Issue:** Skeleton renders between sections when one data source (e.g., teams) is loaded but another (e.g., matches) is still loading. Creates a confusing split between real content and skeleton.
- **Risk:** Unclear loading state on refresh — "are my matches here or not?"

### 2.4 Match Card Shows "Team" for Missing Team Data

- **File:** `components/match-card.tsx:84`
- **Issue:** If `teams` collection is empty, every card falls back to the literal `"Team"` for both sides with no loading indication. On a public page, this looks broken.
- **Risk:** Game-day visitors see "Team vs Team" on all cards if teams haven't loaded.

### 2.5 Mobile Dropdown Missing Bottom Padding/Safe Area

- **File:** `components/public-navbar.tsx`
- **Issue:** On modern phones with gesture bars, the mobile menu extends into the system navigation area. No `pb-safe` or `env(safe-area-inset-bottom)` padding.
- **Risk:** Bottom buttons un-tappable on iPhone X+ / Android 10+.

---

## 3. HIGH — Data Fetching & Race Conditions

### 3.1 Realtime Subscription: Full Re-Fetch on Every Change

- **File:** `lib/public-data.ts:49-51`
- **Issue:** On *every* database change, `load()` is called which re-fetches **all rows** from the table. For tables like `matches` with ongoing scoring, this means the public view re-fetches every match on every ball/goal/rally.
- **Risk:** Unnecessary bandwidth — public pages may refetch dozens of rows per event. On game day with many concurrent spectators, this multiplies load.

### 3.2 `usePrivate*` Hooks Use Public (Unauthenticated) Access

- **File:** `lib/organizer-data.ts:6-12`
- **Issue:** Despite the "private" naming, `usePrivateCollection` and `usePrivateDocument` delegate directly to `usePublicCollection`/`usePublicDocument`, which use the **anon key** (not service-role). There is zero authentication enforcement on the client side.
- **Risk:** Any user (logged-in or not) can read all data if the Supabase anon key's RLS is ever relaxed.

### 3.3 `callOrganizerCommand` Lacks Network Timeout

- **File:** `lib/organizer-data.ts:18-27`
- **Issue:** No `AbortController` or timeout on the fetch call. If the network hangs, the organizer UI freezes indefinitely — no cancel, no retry.
- **Risk:** On game day with spotty network, scoring operators get stuck.

### 3.4 `crypto.randomUUID()` Runtime Compatibility

- **File:** `lib/organizer-data.ts:30`
- **Issue:** `crypto.randomUUID()` is not supported in all environments (Safari <15.4, some serverless edge runtimes). A hard crash occurs at runtime if unsupported.
- **Risk:** Organizer scoring page crashes on older devices/browsers.

---

## 4. HIGH — Supabase Database Schema Risks

### 4.1 RLS Policy: `FOR ALL USING (TRUE)` On Every Table

- **File:** `scripts/supabase-schema.sql:160-161`
- **Issue:** The `_write_all` policy template grants ALL operations (INSERT, UPDATE, DELETE) on every table with `using (true)`. Currently only `SELECT` is granted to anon/authenticated via GRANT, but any future GRANT change instantly opens every table to public writes.
- **Risk:** A misconfiguration during deployment could expose all tables to data destruction.

### 4.2 Missing Index on `matches.revision`

- **File:** `scripts/supabase-schema.sql:32`
- **Issue:** `revision` is a generated column used in `UPDATE ... WHERE revision = expectedRevision` for optimistic concurrency (in `supabase-admin.ts:74-84`). Without an index, every optimistic lock check performs a full table scan.
- **Risk:** Slow scoring operations as the match count grows.

### 4.3 Missing Foreign Key Constraints

- **File:** `scripts/supabase-schema.sql`
- **Issue:** No FK constraints — `players.team_id`, `matches.home_team_id`, etc. Deleting a team leaves orphaned players, awards, and standings entries. The application must manage all referential integrity manually.
- **Risk:** Orphaned data after any manual DB cleanup.

### 4.4 `command_receipts` Table Publicly Exposed

- **File:** `scripts/supabase-schema.sql` (same policy as other tables)
- **Issue:** The idempotency table (`command_receipts`) has the same broad policy. It contains operational metadata (`commandId`, `matchId`, `response`). Currently blocked by GRANT SELECT, but policy says "anyone can do anything".
- **Risk:** Accidental exposure of operational internals.

---

## 5. MEDIUM — Cricket-Specific Scoring Issues

### 5.1 Over-End Strike Rotation: Double Swap Is Fragile

- **File:** `packages/domain/src/cricket.ts:297-299,319-321`
- **Issue:** At over-end with an odd number of runs, the strike swaps twice (odd-runs + over-end), netting to no swap. The logic is correct in tested cases but fragile and hard to maintain. A future refactor could easily break it.
- **Risk:** Subtle strike rotation bug after a code change.

### 5.2 No Super Over Tie-Break Handling

- **File:** `packages/domain/src/cricket.ts:436`
- **Issue:** `cricketResultText` returns `null` when scores are tied even after Super Over. If both innings and Super Over end tied, the result shows as pending/null rather than "Match Tied".
- **Risk:** Deadlocked match with no resolution path in the UI.

### 5.3 `cricketLeaders` Missing NaN Guard in Strike Rate/Economy

- **File:** `lib/command-handlers.ts:926`
- **Issue:** If `balls` is 0, `(runs / balls) * 100` produces `Infinity`. The `.toFixed(2)` call on Infinity throws an error. Same for `bowlingBalls` economy calculation.
- **Risk:** Leaderboard page crashes if a batter has 0 balls faced.

### 5.4 Cricket Scorecard Displays NRR Even for 0 Balls Bowled

- **File:** `components/sport-view.tsx:450`
- **Issue:** `netRunRate.toFixed(3)` is displayed unconditionally. For teams with 0 balls bowled, this shows `NaN` or the fallback value (which is 0).
- **Risk:** Confusing display in early tournament (first few matches).

---

## 6. MEDIUM — Throwball-Specific Issues

### 6.1 No Upper Score Cap (Runaway Scoring)

- **File:** `packages/domain/src/throwball.ts:62-75`
- **Issue:** `checkThrowballSetComplete` has no upper cap. Scores like 100-98 would be treated as a valid set with no maximum. In most throwball/volleyball rules, a cap prevents infinite games.
- **Risk:** An excessively long set with no termination.

### 6.2 Throwball Score Shown as Plain Number on Cards

- **File:** `components/match-card.tsx:60-62`
- **Issue:** Match card shows throwball score as a single number (e.g., `11`) with no indication of sets or match flow. Viewers see "11-9" but don't know if it's 1-0 or 2-1 in sets.
- **Risk:** Misleading score display for spectators.

### 6.3 `recalculateThrowballMatch` Mutates Stats In-Place

- **File:** `packages/domain/src/throwball.ts:158-166`
- **Issue:** `recalculateThrowballMatch` mutates `playerStats` objects directly (no deep copy). Currently safe because it starts from `createThrowballMatch()`, but any future reuse of existing state would corrupt the original.
- **Risk:** Silent data corruption from refactoring.

---

## 7. MEDIUM — Field Sport (Football/Handball) Issues

### 7.1 Sudden Death Winner Declaration Delayed

- **File:** `packages/domain/src/field-sports.ts:187-200`
- **Issue:** Winner declared only when both teams have taken the **same** number of sudden-death attempts. Real football shootouts end immediately when one scores and the other misses in the same round (asymmetric attempts). This implementation waits an extra round.
- **Risk:** Incorrect shootout outcome on game day — match continues when it should end.

### 7.2 Field Sport League Mode: Draws Not Possible for Handball

- **File:** `lib/command-handlers.ts:818-820`
- **Issue:** The standings calculation only adds draws when `sport === "football"`. For handball league matches, drawn matches are treated as: `if (homeScore > awayScore) home wins` / `else if (awayScore > homeScore) away wins` / `else { nothing }`. A drawn handball match silently contributes zero points to **both** teams.
- **Risk:** Missing points for both teams in a drawn handball league match.

---

## 8. MEDIUM — UI/UX Issues

### 8.1 Hydration Mismatch from `useSyncExternalStore` Misuse

- **File:** `components/public-navbar.tsx:18,24`
- **Issue:** `useSyncExternalStore` is used with a no-op subscribe function. React detects a mismatch between server snapshot (`false`) and client snapshot (`true`), triggering a console warning and forced client re-render.
- **Risk:** Console noise in development; potential layout shift on hydration.

### 8.2 Scroll Event Triggers Full Re-Render on Every Pixel

- **File:** `components/public-navbar.tsx:27`
- **Issue:** `useMotionValueEvent` calls `setScrolled()` on every scroll pixel change. Each call re-renders the entire navbar (brand logo, links, theme button, hamburger). No debounce or throttling.
- **Risk:** Janky scroll performance on low-end devices.

### 8.3 Theme Toggle Missing Dynamic `aria-label`

- **File:** `components/public-navbar.tsx:56-63`
- **Issue:** The aria-label is hard-coded to "Toggle color theme". Screen readers can't determine current state (light vs dark).
- **Risk:** Accessibility failure for blind users.

### 8.4 No `prefers-reduced-motion` Support

- **File:** `app/globals.css` (missing)
- **Issue:** Smooth scrolling, confetti, and pulse animations have no media query fallback. Users with vestibular disorders may experience discomfort.
- **Risk:** Accessibility compliance issue.

### 8.5 Missing Security Headers

- **File:** `next.config.ts` (missing)
- **Issue:** No CSP, HSTS, X-Frame-Options, or X-Content-Type-Options headers. The site is vulnerable to clickjacking and MIME-type sniffing.
- **Risk:** Production security gap.

---

## 9. LOW — Minor / Cosmetic

| # | File | Line | Issue |
|---|------|------|-------|
| 9.1 | `app/globals.css` | 44-49 | Shadow tiers `2xs`/`xs` and `sm`/`default` are identical — no visual depth hierarchy |
| 9.2 | `lib/web-types.ts` | 17-19 | `scoreSummary` intersection type with `Record<string, number>` is fragile — adding keys makes them `never` |
| 9.3 | `lib/web-types.ts` | 107-110 | `SportStandingDocument.rows` is a non-discriminated union — consumers infer type from context |
| 9.4 | `supabase-schema.sql` | — | `matches.updated_at` has no index for "recent activity" sorting |
| 9.5 | `components/match-card.tsx` | 66 | Color comparison case sensitivity — fine but fragile |
| 9.6 | `components/home-view.tsx` | 26 | Empty API response silently falls back to seed data, masking data loss |
| 9.7 | `components/team-standings.tsx` | — | Not reviewed — verify standalone responsiveness |

---

## 10. PERFORMANCE

| # | Issue | File | Impact |
|---|-------|------|--------|
| 10.1 | Realtime re-fetches ALL rows on every DB change | `lib/public-data.ts:49-51` | Unnecessary bandwidth with many spectators |
| 10.2 | Filter/sort runs on every render (no `useMemo`) | `components/home-view.tsx:29-41` | Wasted CPU on re-renders |
| 10.3 | Scroll handler triggers full navbar re-render | `components/public-navbar.tsx:27` | Scroll jank on low-end devices |
| 10.4 | Missing `next.config` `standalone` output | `next.config.ts` | Large Docker images |
| 10.5 | Standings/leaderboards recomputed on every match end | `lib/command-handlers.ts:1007-1008` | Acceptable for S9 scale (4 teams per sport) |

---

## 11. RECOMMENDED PRE-GAME FIX ORDER

1. **Fix throwball multi-set support** (1.1) — will block matches mid-game
2. **Fix lexical match sorting** (1.2) — wrong fixture order = confusion
3. **Fix shootout toss undo bug** (1.4) — match state corruption
4. **Fix extraRuns API ambiguity in UI** (1.6) — wrong cricket scoring
5. **Add network timeout to organizer commands** (3.3) — scoring operators stuck on network blip
6. **Fix field sport draw handling for handball** (7.2) — missing league points
7. **Fix sudden death winner timing** (7.1) — shootout continues when it should end
8. **Add crypto.randomUUID fallback** (3.4) — crash on older devices
9. **Add missing indexes on `matches.revision`** (4.2) — slow scoring as match count grows
10. **Fix hydration mismatch** (8.1) — layout shift on load
