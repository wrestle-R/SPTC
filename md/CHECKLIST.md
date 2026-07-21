# ✅ SPTC Fiesta — Progress Checklist

> Live progress tracker for all changes. Updated as tasks are completed.

---

## Progress Overview

```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100% Complete (17 / 17 sections)
```

| Status | Count |
|--------|-------|
| ✅ Completed | 17 |
| 🔄 In Progress | 0 |
| ⏳ Pending | 0 |
| ❌ Blocked | 0 |

### Verification summary

- Domain-first TDD: 32 tests passing across fixtures, seed rosters, standings, cricket, field sports, and MVP calculations.
- Web: lint, TypeScript, production build, desktop/mobile browser checks, and live public endpoint checks completed.
- Expo apps: clean installs, lint, TypeScript, Expo Doctor (18/18), static web exports, phone/tablet browser checks, and console/error inspection completed.
- Screenshots are stored in `artifacts/screenshots/`.
- Compatibility resolution: Expo SDK 54 officially targets React Native 0.81, React 19.1, and Expo Router 6. The incompatible React Native 0.76 / React 18.3 / Router 4 combination from the original request was replaced by the official SDK 54 package set.

---

## Section 1: Branding & Logo

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Remove background from `logo.png` | ✅ | |
| 1.2 | Update `BrandLogo` component to use `logo.png` | ✅ | |
| 1.3 | Replace logo in expo-organizer assets | ✅ | app icon, splash, favicon, adaptive icon |
| 1.4 | Replace logo in expo-viewer assets | ✅ | app icon, splash, favicon, adaptive icon |
| 1.5 | Update `app.json` icon/splash config in both Expo apps | ✅ | |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 2: Expo SDK Downgrade (54.0.8)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Downgrade expo-organizer `package.json` | ✅ | Expo `~54.0.36`, current supported SDK 54 patch |
| 2.2 | Downgrade expo-viewer `package.json` | ✅ | Expo `~54.0.36`, current supported SDK 54 patch |
| 2.3 | Update all Expo sub-packages to SDK 54 versions | ✅ | Validated by Expo Doctor 18/18 |
| 2.4 | Update React/React Native versions | ✅ | Official SDK 54: React 19.1, RN 0.81.5 |
| 2.5 | Verify no breaking API changes (expo-router 4.x) | ✅ | Official SDK 54 Router `~6.0.24`; both exports pass |
| 2.6 | Run `npm ci` in both apps to verify | ✅ | Clean installs pass without legacy peer flags |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 3: Testing Setup

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Configure expo-viewer on port 8081 | ✅ | |
| 3.2 | Configure expo-organizer on port 8082 | ✅ | |
| 3.3 | Check SafeAreaView usage in expo-viewer | ✅ | all screens |
| 3.4 | Check SafeAreaView usage in expo-organizer | ✅ | all screens |
| 3.5 | Responsive checks on both apps | ✅ | 390x844 phone and 768x1024 tablet |
| 3.6 | Run `npm ci` on both apps | ✅ | Clean installs verified |
| 3.7 | Verify web endpoints against Vercel | ✅ | Home/Teams 200; command endpoint structured validation response |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 4: Teams Page Redesign (Web)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Replace colored dot with left accent bar/ribbon | ✅ | 4-6px vertical bar in team color |
| 4.2 | Display full team names prominently | ✅ | "Crimson Warriors" not "Crimson" |
| 4.3 | Improve overall aesthetics | ✅ | clean, premium look |
| 4.4 | Verify stacked bar chart + table still work | ✅ | discipline column removed |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 5: Fixture Creation Changes

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Remove date/time from fixture form (web) | ✅ | |
| 5.2 | Remove venue from fixture form (web) | ✅ | |
| 5.3 | Remove date/time from fixture form (expo-organizer) | ✅ | |
| 5.4 | Remove venue from fixture form (expo-organizer) | ✅ | |
| 5.5 | Add auto-generated match number per sport | ✅ | CR-001, FB-001, HB-001 |
| 5.6 | Make match statuses clearly visible (Live/Upcoming/Completed) | ✅ | distinct colors/badges |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 6: Organizer Expo App — Bug Fixes

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Fix "Start Match" button (currently does nothing) | ✅ | Check command dispatch |
| 6.2 | Fix cricket delivery recording | ✅ | `recordCricketDelivery` |
| 6.3 | Fix field sport event recording | ✅ | `recordFieldEvent` |
| 6.4 | Verify sync with Vercel endpoints | ✅ | |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 7: Cricket Display Fixes

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Mark dismissed batters visually (strikethrough/red/OUT badge) | ✅ | viewer + web |
| 7.2 | Fix any other minor cricket bugs | ✅ | |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 8: Remove Add Player — Finalize Rosters

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | Remove add/edit/delete player UI from expo-organizer | ✅ | make read-only |
| 8.2 | Remove add/edit/delete player UI from web organizer | ✅ | make read-only |
| 8.3 | Update Crimson Warriors roster in seed data | ✅ | 19 players |
| 8.4 | Update God's Gladiators roster in seed data | ✅ | 19 players |
| 8.5 | Update Karuppu Knights roster in seed data | ✅ | 19 players |
| 8.6 | Update Ivory Elites roster in seed data | ✅ | 20 players |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 9: Remove Discipline Points (Everywhere)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 9.1 | Remove from domain types (`types.ts`) | ✅ | |
| 9.2 | Remove from standings calculations (`standings.ts`) | ✅ | |
| 9.3 | Remove from web team-standings component | ✅ | |
| 9.4 | Remove from web teams page | ✅ | |
| 9.5 | Remove from organizer settings page | ✅ | |
| 9.6 | Remove from organizer awards page | ✅ | |
| 9.7 | Remove from expo-viewer teams tab | ✅ | |
| 9.8 | Remove from Firestore data projections | ✅ | |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 10: Sidebar Cleanup (Web Organizer)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 10.1 | Remove `FirebaseStatus` from `dashboard-shell.tsx` | ✅ | Lines 79-81 |
| 10.2 | Remove `import { FirebaseStatus }` | ✅ | |
| 10.3 | Delete `firebase-status.tsx` component file | ✅ | |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 11: Dashboard Header Cleanup (Web Organizer)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 11.1 | Remove "Public site" button | ✅ | Lines 103-106 |
| 11.2 | Remove "More options" / three dots button | ✅ | Lines 108-112 |
| 11.3 | Clean up unused imports | ✅ | ExternalLink, MoreHorizontal, Tooltip |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 12: Public Navbar Cleanup (Web)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 12.1 | Remove Football nav link | ✅ | |
| 12.2 | Remove Handball nav link | ✅ | |
| 12.3 | Remove Cricket nav link | ✅ | |
| 12.4 | Keep Teams link + Logo + Theme toggle | ✅ | |
| 12.5 | Update mobile hamburger menu | ✅ | Teams only |
| 12.6 | Remove "Season 9" from BrandLogo | ✅ | subtitle text |
| 12.7 | Remove "Sports Fiesta S9" from footer | ✅ | |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 13: Footer Update (Web)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 13.1 | Replace footer text with "Made with love by Russel and Patrick" | ✅ | `public-shell.tsx` |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 14: Back Button (Expo Viewer)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 14.1 | Add back button to `match/[matchId].tsx` | ✅ | `router.back()` or Stack `headerLeft` |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 15: Fall of Wickets Section (Expo Viewer)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 15.1 | Add Fall of Wickets section after bowling table | ✅ | |
| 15.2 | Format: `Score (Over) — Batter name` | ✅ | |
| 15.3 | Show "No wickets lost yet" fallback | ✅ | |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 16: Mobile App Restructure (expo-viewer)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 16.1 | Install `@rnr/reusables` package | ✅ | Requested package does not exist; installed official `@react-native-reusables/cli` |
| 16.2 | Replace custom components with reusables | ✅ | Source-owned shadcn-style primitives generated locally |
| 16.3 | Create NEW Home tab | ✅ | Stats row (Live/All/Teams/Players) + Create Fixture + match list |
| 16.4 | Create NEW Matches tab | ✅ | Scheduled, Live, Upcoming matches |
| 16.5 | Create NEW Sports tab with rankings | ✅ | Team rankings + individual sport rankings + top performers |
| 16.6 | Create NEW Profile tab | ✅ | Theme toggle only |
| 16.7 | Update tab layout (`_layout.tsx`) | ✅ | 4 new tabs: Home, Matches, Sports, Profile |
| 16.8 | Update root layout | ✅ | Stack nav changes |
| 16.9 | Ensure same design language as website | ✅ | colors, typography, spacing |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Section 17: Expo Viewer Theme Support

| # | Task | Status | Notes |
|---|------|--------|-------|
| 17.1 | Add light mode color palette | ✅ | |
| 17.2 | Theme toggle on Profile tab | ✅ | |
| 17.3 | Persist theme choice (AsyncStorage) | ✅ | |
| 17.4 | Update all components for theme awareness | ✅ | |

**Section progress:** `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

---

## Quick Stats

```
Total tasks:   68
✅ Completed:   68
🔄 In Progress: 0
⏳ Pending:    0
❌ Blocked:     0
```

> **Note:** Task 16.4 "Teams tab with line chart" has been removed per spec. Teams/standings info is now shown in the Stats row (Home tab) and Sports rankings (Sports tab).

---

*Last updated: 2026-07-21*
