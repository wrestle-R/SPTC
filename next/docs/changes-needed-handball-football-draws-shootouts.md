# Handball and Football Draw/Shootout Verification

Verified on July 22, 2026.

## Final Rule Behavior

| Sport | League matches | 3rd place match | Final |
|---|---|---|---|
| Football | Draw allowed | If level, penalty shootout required | If level, penalty shootout required |
| Handball | If level, shootout required | If level, shootout required | If level, shootout required |

## What Was Fixed

- Match stage handling now uses `third-place` consistently in the runtime match flow.
- Football shootout UI now appears for `third-place` and `final` only when the score is level, and it stays visible once shootout events begin.
- Handball shootout UI remains available for any stage when the score is level, and it stays visible once shootout events begin.
- Public and organizer match flows remain aligned with the backend rule that handball cannot end in a draw.
- Football league matches still allow draws.

## Files Updated

- `next/components/organizer-match-scorer.tsx`
- `next/lib/command-handlers.ts`
- `next/lib/web-types.ts`
- `next/packages/domain/src/types.ts`
- `next/docs/changes-needed-handball-football-draws-shootouts.md`

## Verification Performed

- Searched runtime code for stage-name mismatches.
- Confirmed the remaining `decider` references are only bracket field names in `next/lib/command-handlers.ts`, not match stage values.
- Ran domain tests:

```bash
npm test --workspace @sports-fiesta/domain
```

Result: 53 tests passed.

- Ran app typecheck:

```bash
npm run typecheck
```

Result: passed.

- Ran app lint:

```bash
npm run lint
```

Result: passed.

## Expected UI Behavior

- Football `league`: no shootout controls, draw allowed.
- Football `third-place`: shootout controls appear when scores become level.
- Football `final`: shootout controls appear when scores become level.
- Handball `league`, `third-place`, `final`: shootout controls appear when scores become level.
- Once a shootout has started, the shootout panel stays visible until the match is resolved.

## Remaining Note

The word `decider` still exists in bracket storage fields such as `brackets.decider`. That is separate from match stage values and does not break the football or handball shootout flow.
