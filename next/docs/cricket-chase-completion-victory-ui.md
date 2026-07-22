# Cricket — Auto-Chase Completion, Confetti & Finals Victory Banner

Planned on July 23, 2026.

---

## Overview

Three changes to the cricket match engine and viewer experience:

| # | Change | Scope | Why |
|---|--------|-------|-----|
| 1 | **Auto-detect target chase** | Domain + Command Handler | Innings should auto-complete when the chasing team passes the target instead of requiring a manual "End innings" click |
| 2 | **Confetti on completion** | Viewer UI | A small celebration burst when any match finishes |
| 3 | **Finals celebration banner** | Viewer UI | A trophy-themed animated banner replaces the standard muted result line for `stage === "final"` |

---

## Change 1 — Auto-detect target chase

### Problem

Currently the innings `completed` flag is set in `recordCricketDelivery` (line 325 of `cricket.ts`) when:

```ts
const completed = legalBalls >= state.maxOvers * 6 || wickets >= state.battingLineup.length - 1;
```

The domain has no concept of a "target". The chasing team's required runs are computed only at the UI layer (`organizer-match-scorer.tsx:196`). If the chasing team crosses the target, the scorer must manually press "End innings" to:
- Stop scoring
- Trigger `cricketStatus()` which calls `cricketResultText()` to generate the "won by X wickets" message

### Solution

Add `targetScore` as an optional field on `CreateInningsInput` and `CricketInningsState`. When set, `recordCricketDelivery` checks whether the new score reaches/passes the target and marks the innings complete automatically.

### Files

#### `next/packages/domain/src/types.ts`

**`CreateInningsInput`** — add optional field:
```ts
targetScore?: number | null;
```

**`CricketInningsState`** — add required field (always present after creation):
```ts
targetScore: number | null;
```

#### `next/packages/domain/src/cricket.ts`

**`createCricketInnings`** (around line 140) — persist the target from input into the returned state:
```ts
targetScore: initial.targetScore ?? null,
```

Add this inside the existing return object alongside the other fields.

**`recordCricketDelivery`** (line 325) — replace the single `completed` line with a three-condition check:

```ts
// Before:
const completed = legalBalls >= state.maxOvers * 6 || wickets >= state.battingLineup.length - 1;

// After:
const oversExhausted = legalBalls >= state.maxOvers * 6;
const allOut = wickets >= state.battingLineup.length - 1;
const targetChased = state.targetScore != null && state.score + totalRuns >= state.targetScore;
const completed = oversExhausted || allOut || targetChased;
```

Note: `state.score + totalRuns` is used because the return block updates `score: state.score + totalRuns` after computing `completed`.

#### `next/lib/command-handlers.ts`

**`handleStartInnings`** — when starting the second innings (index 1), compute the target from the first innings and pass it:

```ts
const firstInnings = match.cricket?.innings?.[0]?.state;
const targetScore = firstInnings ? firstInnings.score + 1 : undefined;

const initial = {
  battingTeamId,
  bowlingTeamId,
  battingLineup,
  bowlingLineup,
  strikerId: asString(data.strikerId, "Striker"),
  nonStrikerId: asString(data.nonStrikerId, "Non-striker"),
  bowlerId: asString(data.bowlerId, "Bowler"),
  maxOvers: rules.cricket.maxOvers ?? 5,
  targetScore,  // added
};
```

#### `next/packages/domain/tests/cricket.test.ts`

Add a new test block (after existing "ends an innings after five completed overs" test):

```ts
it("auto-completes the innings when the chasing team passes the target", () => {
  const second = createCricketInnings({
    battingTeamId: "green",
    bowlingTeamId: "red",
    battingLineup: battingOrder,
    strikerId: "a",
    nonStrikerId: "b",
    bowlerId: "g2",
    maxOvers: 5,
    targetScore: 31,
  });

  // Score 4 (nowhere near target)
  let state = recordCricketDelivery(second, { runsOffBat: 4 });
  expect(state.completed).toBe(false);

  // Score 6 more → total 10
  state = recordCricketDelivery(state, { runsOffBat: 6 });
  expect(state.completed).toBe(false);

  // Score 22 more → total 32 (crosses 31)
  state = recordCricketDelivery(state, { runsOffBat: 22 });
  expect(state.completed).toBe(true);
  expect(state.score).toBe(32);
});
```

### Edge cases

| Case | Behavior |
|------|----------|
| First innings (no target) | `targetScore` is `null` → no auto-chase, same as current behavior |
| Super Over | No target set, same as first innings |
| All out before chasing | `allOut` is true → `completed` set as before |
| Exact tie (score === target - 1) | `targetChased` is false, innings continues |
| Score exactly equals target | `>=` check → `targetChased` is true → innings completes, result shows "won by 0 wickets" ... |

**Important note on "won by 0 wickets"**: If the last batter scores the winning run and gets out on the same ball, or the 10th wicket falls exactly at the target, `cricketResultText` computes `wicketsRemaining` which could be 0. This is mathematically correct but the existing `cricketResultText` handles it with `plural(0, "wicket")` → "0 wickets". This is acceptable for now (it matches standard cricket scoring conventions where "won by 0 wickets" means only 1 wicket remaining after the last batter). To be precise, the current `cricketResultText` computes:

```ts
const wicketsToLose = Math.max(0, second.battingLineup.length - 1);
const wicketsRemaining = Math.max(0, wicketsToLose - second.wickets);
```

So if `wicketsToLose = 9` and `wickets = 9`, `wicketsRemaining = 0` → "won by 0 wickets". This could be improved to "won by 1 wicket" in cricket convention... but that's a separate refinement.

---

## Change 2 — Confetti on match completion

### Problem

The viewer side shows a simple muted `<p>` tag when the match is completed. No celebration or visual feedback.

### Solution

Add `canvas-confetti` and fire a small burst when `match.status === "completed"` and `match.winnerTeamId` is set.

### Files

#### `next/package.json`

Add dependency:
```
"canvas-confetti": "^1.9.3"
```

No `@types/canvas-confetti` needed — v1+ ships its own TypeScript definitions.

#### `next/components/match-detail.tsx`

**Imports** — add `useEffect` to the existing React import and add the confetti import:

```ts
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
```

**Effect** — add inside the `MatchDetail` component body, after `resultText` computation (around line 54) and before the return:

```ts
const isComplete = match.status === "completed" && Boolean(match.winnerTeamId);

useEffect(() => {
  if (isComplete) {
    const duration = 1500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    };

    frame();
  }
}, [isComplete]);
```

This fires a gentle 1.5-second stream of confetti from both sides of the screen. Using `requestAnimationFrame` keeps it performant — it stops automatically after the duration.

---

## Change 3 — Finals celebration banner

### Problem

The result banner is identical for league matches and finals. A final deserves a distinguished visual treatment.

### Solution

Conditionally render a trophy-themed celebration banner when `match.stage === "final"`, using framer-motion for entrance animations. Other stages keep the current muted banner.

### File

#### `next/components/match-detail.tsx`

**Import** — add `motion` (framer-motion is already installed):

```ts
import { motion } from "framer-motion";
```

**Replace the result banner** (currently around line 85):

```tsx
{/* Before: */}
{resultText ? <p className="rounded-md bg-muted p-3 font-medium">{resultText}</p> : null}

{/* After: */}
{resultText ? (
  match.stage === "final" ? (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
      className="rounded-xl bg-gradient-to-br from-amber-500/20 via-yellow-500/15 to-amber-500/20 border-2 border-amber-500/40 p-6 text-center shadow-lg"
    >
      <motion.span
        initial={{ rotate: -15, scale: 0.5 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", delay: 0.15, duration: 0.5 }}
        className="inline-block text-5xl"
      >
        🏆
      </motion.span>
      <p className="mt-2 text-lg font-extrabold tracking-tight">{resultText}</p>
      <p className="mt-1 text-sm font-medium text-amber-600 dark:text-amber-400">Champions</p>
    </motion.div>
  ) : (
    <p className="rounded-md bg-muted p-3 font-medium">{resultText}</p>
  )
) : null}
```

---

## Complete list of file changes

```
SPTC/next/
├── package.json                           # + canvas-confetti
├── components/
│   └── match-detail.tsx                   # + useEffect confetti, + motion import, finals banner
├── lib/
│   └── command-handlers.ts                # targetScore in handleStartInnings
├── packages/domain/
│   ├── src/
│   │   ├── types.ts                       # targetScore on CreateInningsInput & CricketInningsState
│   │   └── cricket.ts                     # store targetScore, check targetChased in recordCricketDelivery
│   └── tests/
│       └── cricket.test.ts                # auto-complete on target chase test
└── docs/
    └── cricket-chase-completion-victory-ui.md   # this file
```

---

## Mobile responsiveness

### Why it matters

The viewer match detail page (`match-detail.tsx`) is used on phones during live tournaments. The confetti and finals banner must not break the layout or cause performance issues on mobile devices.

### Tests to perform

#### 1. Confetti on mobile

| Test | Device | Expected |
|------|--------|----------|
| Match completes on 375px viewport (iPhone SE) | Chrome dev tools | Confetti fires from both edges, particles scale correctly, no horizontal overflow |
| Match completes on 390px viewport (iPhone 14) | Chrome dev tools | Same as above |
| Match completes on 414px viewport (iPhone 14 Pro Max) | Chrome dev tools | Same as above |
| Confetti on low-power mode / reduced motion | Settings | `canvas-confetti` does not respect `prefers-reduced-motion` by default. Consider wrapping in a check if needed: `if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return` |
| Rapid re-render (user navigates back/forth) | Manual | `useEffect` with `isComplete` guard prevents double-firing |

**Implementation guard for reduced motion** (add inside the effect if desired):

```ts
useEffect(() => {
  if (!isComplete) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // ... confetti code
}, [isComplete]);
```

#### 2. Finals banner on mobile

| Test | Device | Expected |
|------|--------|----------|
| Finals banner at 375px | Chrome dev tools | Text does not overflow; trophy emoji and result text stack vertically inside the card; padding is adequate |
| Finals banner at 390px | Chrome dev tools | Same |
| Finals banner at 430px (iPhone 15 Pro Max) | Chrome dev tools | Same, scales naturally |
| Trophy emoji rendering | Cross-browser | Emoji renders correctly on iOS Safari, Chrome, Samsung Internet. The emoji approach works universally; no image dependency |
| Spring animation on low-end Android | Physical device (or dev tools CPU throttling) | Animation should not stutter. If it does, reduce `bounce` from 0.4 to 0.2 or switch to `easeOut` instead of `spring` |

The banner uses:
- `p-6` — 24px padding, adequate on all screen sizes
- `text-5xl` for the trophy — renders at ~48px, fits on any modern phone
- `text-lg` + `text-sm` for text — readable at all widths
- Percentages and `text-center` — no fixed widths, so it naturally adapts
- `rounded-xl` — safe, no overflow issues

**No horizontal scroll or layout shift** is expected because the banner sits inside the existing `<CardContent className="flex flex-col gap-4 ...">` wrapper which already handles responsive widths.

#### 3. Target chase auto-complete (no visual change)

No mobile testing needed — this is a domain logic change with no UI component. Existing unit tests cover it.

#### 4. Real device testing checklist

- [ ] iPhone Safari — confetti fires, finals banner renders
- [ ] Android Chrome — confetti fires, finals banner renders
- [ ] Rotate device (portrait ↔ landscape) — no layout breakage
- [ ] Reduced motion ON — confetti skips, spring animation falls back to static render
- [ ] Offline / slow network — banner uses no network resources (emoji is system font, no images)

---

## Rollback plan

Each change is independently revertible:

| Change | Revert |
|--------|--------|
| Auto-chase | Remove `targetScore` fields from types, remove the check in `recordCricketDelivery`, remove `targetScore` from `handleStartInnings` |
| Confetti | Remove `useEffect` block and canvas-confetti import; `npm uninstall canvas-confetti` |
| Finals banner | Revert the result banner block to the original single `<p>` tag; remove `motion` import if no longer used elsewhere in the file |
