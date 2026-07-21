# SPTC Fiesta — All Changes Required

> A comprehensive list of all changes, fixes, and features requested for the SPTC tournament platform (Web + Expo apps).

---

## 1. Branding & Logo

- [ ] Use `logo.png` from `next/public/` as the primary logo across ALL platforms
- [ ] Remove background from `logo.png` (make it transparent PNG)
- [ ] Replace `sports-fiesta-logo.png` references in:
  - `next/components/brand-logo.tsx` — Image src
  - `expo-organizer/assets/images/` — App icon, splash, favicon, adaptive icon
  - `expo-viewer/assets/images/` — App icon, splash, favicon, adaptive icon
  - `expo-organizer/app.json` — Icon/splash config
  - `expo-viewer/app.json` — Icon/splash config

---

## 2. Expo SDK Downgrade (54.0.8)

- [ ] Downgrade `expo-organizer` from ~57.0.7 → 54.0.8
- [ ] Downgrade `expo-viewer` from ~57.0.7 → 54.0.8
- [ ] Update all Expo packages to SDK 54 compatible versions:
  - `expo-router` → 4.0.0
  - `expo-constants`, `expo-device`, `expo-font`, `expo-image`, `expo-linking`, `expo-network`, `expo-secure-store`, `expo-splash-screen`, `expo-status-bar`, `expo-system-ui`, `expo-web-browser`
  - `react-native` → 0.76.x
  - `react` → 18.3.x
  - `react-dom` → 18.3.x
  - `react-native-gesture-handler`, `react-native-reanimated`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`, `react-native-web`, `react-native-worklets`
  - `@react-native-async-storage/async-storage`, `@expo/ui`, `expo-symbols`, `expo-glass-effect`
  - Dev deps: `typescript`, `eslint-config-expo`
- [ ] Verify no breaking API changes between SDK 57 → 54

---

## 3. Testing Setup

- [ ] Configure `expo-viewer` to run on port **8081**
- [ ] Configure `expo-organizer` to run on port **8082**
- [ ] Both apps: check `SafeAreaView` is used properly on all screens (no content breaking into notches/home indicators)
- [ ] Both apps: responsive checks (test on various screen sizes)
- [ ] Both apps: run `npm ci` to verify clean dependency install
- [ ] Web app: verify endpoints work against `https://sptc-fiesta.vercel.app/`

---

## 4. Teams Page Redesign (Web)

- [ ] Replace colored dot indicator with a **left accent bar/ribbon** in the team's color
  - Each team card gets a thick (4-6px) vertical colored bar on the left edge
  - Colors: Crimson = `#ef4444`, Gladiators = `#22c55e`, Knights = `#cbd5e1`, Ivory = `#f8fafc`
- [ ] Display full team names prominently: "Crimson Warriors", "God's Gladiators", "Karuppu Knights", "Ivory Elites"
- [ ] Improve overall aesthetics — clean, premium look
- [ ] Keep: stacked bar chart + points breakdown table

---

## 5. Fixture Creation (Organizer — Web + Expo)

- [ ] **Remove** from fixture creation form:
  - Date/Time field
  - Venue field
- [ ] **Keep** in fixture creation form:
  - Sport selector
  - Home team selector
  - Away team selector
  - Stage (league, semi-final, final)
- [ ] Add **auto-generated match number** per sport:
  - Cricket: `CR-001`, `CR-002`, `CR-003` ...
  - Football: `FB-001`, `FB-002`, `FB-003` ...
  - Handball: `HB-001`, `HB-002`, `HB-003` ...
- [ ] Match statuses must be **clearly visually distinct**:
  - 🟢 **Live** — prominent green/pulsing indicator
  - 🔵 **Upcoming** — blue/info style
  - ⚪ **Completed** — neutral/diminished style

---

## 6. Organizer Expo App — Bug Fixes

- [ ] **Start Match button**: currently does nothing — fix the command dispatch
  - Ensure `startMatch` command is sent to Next.js API (`POST /api/organizer/command`)
  - Check Firestore revision/idempotency logic
- [ ] **Recording events**: fix cricket delivery recording and field sport event recording
  - Ensure `recordCricketDelivery` and `recordFieldEvent` commands work
  - Verify real-time sync via Next.js API at `https://sptc-fiesta.vercel.app`

---

## 7. Cricket Display Fixes (Viewer + Web)

- [ ] **Dismissed batters**: visually mark players who are out
  - Strikethrough name, or red tint, or `[OUT]` badge, or dimmed styling
  - Different from active/currently batting players
- [ ] Fix any other minor cricket scoring/display bugs

---

## 8. Remove "Add Player" — Finalize Rosters

- [ ] Remove all add/edit/delete player UI from:
  - `expo-organizer/src/app/(tabs)/teams.tsx`
  - `next/app/organizer/teams/` pages
- [ ] Make player lists **read-only** (view only, no mutations)
- [ ] Update seed data (`next/packages/domain/src/seed.ts`) to match exact roster:

### 🔴 Crimson Warriors (19)
Daniel Russel Paul, Glen Gladin, Sam Jeyaraj, Jovin Samraj, Melvin Benn, Aaron Ditto, Johan Jagdish, Jenson Shaji, Daniel Ratnaraj, Edwin Anburaj, Jemima John, Rachel Edwin, Hannah Mano, Sharon Jane, Cressida Jebastin, Suja Jebakumar, Christy Jagdish, Anita Ditto, Kaitlyn Eve

### 🟢 God's Gladiators (19)
Patrick Joshua, Edben Kruze, Jeshurun Edwin, John Rajesh, Febin Jagdish, Jeffrey Jebakumar, Eric Edison, Jabez Singh, Ditto Lazar, Benson Wilson, Joselin Daniel, Rheanna Robinson, Maria Antony, Andrea Joyal, Jyotimani Wilson, Esther Robins, Sumitha Jackson, Candice Jebastin, Judith John

### ⚫ Karuppu Knights (19)
Jonathan Kirubaharan, Jerome Jebakumar, Terry Aldrin, Jagdish, Leroy Kinskumar, Abraham Joyal, Ethan Russel, Michael Antony, Robins Duncan, Jackson Andrews, Eunice Edison, Celeste Ditto, Euvance Edison, Joselin Golda, Jas Johh, Jency Sony, Stella Daniel, Jenefa Praiselin, Ansel James

### ⚪ Ivory Elites (20)
Sheldon Benson, Harrison Peter, Akshay James, Immanuel J, Kevin Joash, Frederick John, Jovin Jora, Austin Sundarraj, Robinson Samuel, Jebakumar, Jebastin David, Alecia Wilson, Johannah Jackson, Andrea Prakash, Rhowena Robinson, Rani Edwin, Geeta Benson, Thulasi Edwin, Margaret Michael, Annette Maria

---

## 9. Remove Discipline Points (Everywhere)

- [ ] Remove `discipline` points from:
  - `next/packages/domain/src/standings.ts` — calculations
  - `next/packages/domain/src/types.ts` — data types
  - `next/components/team-standings.tsx` — chart + table
  - `next/app/teams/page.tsx` — UI copy
  - `next/app/organizer/settings/` — settings page
  - `next/app/organizer/awards/` — awards page
  - `expo-viewer/src/app/(tabs)/teams.tsx` — chart + standings
  - All Firestore data projections
  - Public data types

---

## 10. Sidebar Cleanup (Web Organizer)

- [ ] Remove entire `FirebaseStatus` component from `dashboard-shell.tsx` sidebar footer
  - Lines 79-81: `<SidebarFooter><FirebaseStatus /></SidebarFooter>`
  - Remove `import { FirebaseStatus } from "@/components/firebase-status"`
  - Delete `next/components/firebase-status.tsx` entirely

---

## 11. Dashboard Header Cleanup (Web Organizer)

- [ ] Remove **"Public site"** button (line 103-106 of `dashboard-shell.tsx`)
- [ ] Remove **"More options"** / three dots button (line 108-112 of `dashboard-shell.tsx`)
- [ ] Remove associated imports: `ExternalLink`, `MoreHorizontal`, `Tooltip`, `TooltipContent`, `TooltipTrigger` if no longer used

---

## 12. Public Navbar Cleanup (Web)

- [ ] Remove **Football** nav link
- [ ] Remove **Handball** nav link
- [ ] Remove **Cricket** nav link
- [ ] Keep: **BrandLogo**, **Teams** nav link, **Theme toggle** button
- [ ] Keep mobile hamburger menu with same (Teams only)
- [ ] Remove "Season 9" / "S9" references:
  - `BrandLogo` component — remove "Season 9" subtitle text
  - Public footer — remove "Sports Fiesta S9"

---

## 13. Footer Update (Web)

- [ ] Replace footer in `public-shell.tsx`:
  - From: `"Sports Fiesta S9" / "Live tournament view"`
  - To: **"Made with love by Russel and Patrick"**

---

## 14. Back Button (Expo Viewer)

- [ ] Add navigation back button to `expo-viewer/src/app/match/[matchId].tsx`
  - Show a back arrow in the header/top bar
  - Uses `expo-router` `router.back()` or Stack screen `headerLeft`

---

## 15. Fall of Wickets Section (Expo Viewer)

- [ ] Add **Fall of Wickets** section after the Bowling table in `CricketDetail` component
  - Format: `Score (Over) — Batter name`
  - Example: `34/1 (4.2) — Daniel Russel Paul`, `67/2 (8.5) — Glen Gladin`
  - Data derived from dismissal events with their score/overs at time of wicket
  - If no wickets lost, show "No wickets lost yet"

---

## 16. Mobile App Complete Restructure (expo-viewer)

### 16.1 Install react-native-reusables

- [ ] Install `@rnr/reusables` package
- [ ] Replace existing custom components (`screen.tsx`, `ui.tsx`) with reusables equivalents
- [ ] Follow shadcn-style component patterns

### 16.2 New 4-Tab Structure

Replace the current (teams/football/handball/cricket) tab structure with:

| Tab | Name | Content |
|-----|------|---------|
| 1 | **Home** | Stats row (Live / All Matches / Teams / Players counts) + Create Fixture section + match list |
| 2 | **Matches** | Scheduled, Live, and Upcoming matches organized by status |
| 3 | **Sports** | All sports with team rankings + individual sport rankings per sport |
| 4 | **Profile** | Theme toggle only (dark/light mode) |

### 16.3 Tab Details

#### Tab 1: Home
- **Stats row** at the top showing 4 metrics side by side in one row:
  - **Live matches** — count of currently live matches
  - **All matches** — total match count
  - **Teams** — total team count (4)
  - **Players** — total player count (72+)
- **Create Fixture** section below the stats row:
  - Sport selector, Home team, Away team, Stage
  - Auto-generated match number per sport (CR-001, FB-001, HB-001)
- **Match list** below showing all matches with clear Live / Upcoming / Completed badges

#### Tab 2: Matches
- **Scheduled** section: matches that are scheduled but not yet started
- **Live** section: currently active matches with live scores
- **Upcoming** section: next matches to be played
- Each match clearly labeled with its status badge

#### Tab 3: Sports
- List of all sports (Cricket, Football, Handball)
- Each sport shows a **team ranking** — how each of the 4 teams is placed in that sport
- Tap a sport to drill down into its **individual sport ranking**:
  - Points table for that sport
  - Matches played / won / lost / drawn
  - **Top performers**:
    - Cricket: Top 3 bowlers (wickets), Top 3 batsmen (runs)
    - Football: Top 3 scorers (goals), Most clean sheets
    - Handball: Top 3 scorers (goals), similar metrics

#### Tab 4: Profile
- Theme toggle only: switch between dark mode and light mode
- Persist theme preference (AsyncStorage)

### 16.4 Design Principles
- Same color palette as the website (brand orange `#f97316`, teal `#14b8a6`)
- Dark background (`#111210`), surface (`#1a1b18`), text (`#f5f5f0`)
- Same typography hierarchy and spacing
- Cards, sections, and layout mirror the web app's design language

---

## 17. Expo Viewer Theme Support

- [ ] Add theme toggle (dark/light) to Profile tab
- [ ] Persist theme choice via AsyncStorage
- [ ] Update all component colors to respond to theme changes
- [ ] Ensure consistent dark = current colors, light = appropriate light mode colors

---

## Summary of Files to Modify

### next/ (Web)

| File | Change |
|------|--------|
| `public/logo.png` | Process to remove bg |
| `components/brand-logo.tsx` | Update logo src, remove "Season 9" |
| `components/public-shell.tsx` | Update footer text |
| `components/public-navbar.tsx` | Remove Football/Handball/Cricket links |
| `components/dashboard-shell.tsx` | Remove FirebaseStatus, Public site btn, three dots |
| `components/firebase-status.tsx` | Delete entirely |
| `components/team-standings.tsx` | Remove discipline, redesign team cards with left accent bar |
| `app/teams/page.tsx` | Remove discipline references |
| `packages/domain/src/seed.ts` | Update rosters to user's exact lists |
| `packages/domain/src/standings.ts` | Remove discipline calculations |
| `packages/domain/src/types.ts` | Remove discipline field |
| Organizer matches page | Remove date/time/venue from fixture form, add match number |
| Organizer teams page | Remove add/edit/delete player UI |

### expo-organizer/

| File | Change |
|------|--------|
| `package.json` | Downgrade to SDK 54.0.8, update all deps |
| `app.json` | Update icon/splash to logo.png (bg removed) |
| `src/app/(tabs)/home.tsx` | Fix fixture form (remove date/venue, add match number), fix start match |
| `src/app/(tabs)/teams.tsx` | Remove add/edit/delete player, make read-only |
| `src/app/match/[matchId].tsx` | Fix start match button, fix event recording |
| `assets/images/` | Replace logo files with processed logo.png |

### expo-viewer/

| File | Change |
|------|--------|
| `package.json` | Downgrade to SDK 54.0.8, add @rnr/reusables |
| `app.json` | Update icon/splash to logo.png (bg removed) |
| `src/app/_layout.tsx` | Update root layout for new nav structure |
| `src/app/(tabs)/_layout.tsx` | Complete rewrite: 4 tabs (Home, Matches, Sports, Profile) |
| `src/app/(tabs)/index.tsx` | Redirect to home |
| `src/app/(tabs)/home.tsx` | NEW — Stats row (Live/All/Teams/Players) + Create Fixture + match list |
| `src/app/(tabs)/matches.tsx` | NEW — Scheduled, Live, Upcoming matches |
| `src/app/(tabs)/sports.tsx` | NEW — Sports list with team rankings + individual sport rankings |
| `src/app/(tabs)/profile.tsx` | NEW — Theme toggle only |
| `src/app/match/[matchId].tsx` | Add back button, add fall of wickets section |
| `src/components/` | Refactor with @rnr/reusables |
| `src/lib/theme.ts` | Add light theme support |
| `assets/images/` | Replace logo files with processed logo.png |
