# Cricket Mobile UI Update

## Scope

This update documents the mobile-only cleanup for the cricket match-detail experience in both viewer and organizer flows.

- Viewer: `next/components/match-detail.tsx`
- Organizer: `next/components/organizer-match-scorer.tsx`
- Applies only below the `sm` breakpoint through `max-sm:` utilities.
- Desktop and laptop styling remain unchanged because their existing classes are retained and mobile overrides do not apply at `sm` and above.

## Problem identified

The cricket scorecard previously read as a sequence of components nested inside another component on narrow screens. The outer match card, batters block, bowlers block, and fall-of-wickets block each supplied their own border or background. At mobile widths those repeated visual boundaries made the page feel boxed in and interrupted the reading flow.

The same pages also used desktop-oriented spacing. Large section gaps and generous horizontal padding consumed too much of a narrow viewport, leaving unnecessary blank space and pushing score information farther down the page.

## Mobile treatment

The intended mobile hierarchy is a single scrollable scorecard surface:

1. Keep the match identity, innings switcher, score, and controls clear.
2. Flatten nested scorecard modules by removing their mobile borders and background fills.
3. Use spacing and typography rather than repeated outlined containers to separate batting, bowling, and dismissal information.
4. Reduce excess gaps and horizontal padding while retaining vertical row padding and unchanged touch targets.

## Viewer scorecard changes

`match-detail.tsx` uses mobile-only overrides to make the viewer scorecard compact without changing desktop presentation.

- The primary card content uses a smaller mobile gap and top padding, while retaining the original `sm:` spacing.
- The cricket score wrapper tightens the space between the innings selector, batting table, bowling table, and ball progression only on mobile.
- Batting and bowling outer containers lose their mobile border and background, leaving desktop `rounded-lg border` styling intact.
- Table headers become transparent and sit flush horizontally on phones; the original desktop backgrounds and padding remain at `sm` and above.
- Batting and bowling row wrappers remove only horizontal mobile padding. Their vertical padding, grid columns, `min-w-0`, `break-words`, and numeric alignment remain in place.
- The "Yet to bat" and "Fall of wickets" areas become borderless and flush horizontally on mobile, but keep vertical padding for readable separation.
- Ball-progression rows use a smaller mobile gap while each delivery retains its existing minimum touch size and text treatment.

## Organizer scorecard changes

`organizer-match-scorer.tsx` follows the same mobile hierarchy so the scoring workflow does not look like a card inside a card.

- The cricket console grid uses a smaller mobile gap; the desktop gap is explicitly retained from `sm` upward.
- The organizer scorecard content uses tighter mobile vertical spacing and top padding while preserving its desktop `gap-5` and `pt-5` values.
- Batting and bowling score modules remove their mobile borders and background fills, then restore their desktop visual framing automatically at the `sm` breakpoint.
- Mobile table headers and rows remove excess horizontal padding only; content keeps its grid layout, word wrapping, tabular number alignment, and vertical row padding.
- The fall-of-wickets block removes its mobile border and horizontal inset while preserving vertical padding and all text.
- Ball-progression spacing is reduced only on mobile. No button, selector, or delivery-control touch target is reduced.

## Readability and safety safeguards

The cleanup intentionally does not flatten the scorecard into an unstructured list.

- Typography, colors, font weights, and content order are unchanged.
- `break-words`, `truncate`, and `min-w-0` protections remain, so long player names and dismissal descriptions can wrap instead of being cropped.
- Vertical padding remains around table rows and information blocks, protecting readability and tap comfort.
- The innings switcher and organizer delivery controls retain their existing interaction treatment.
- No desktop, laptop, navbar, footer, or general-page layout behavior is modified by the mobile overrides.

## Expected result

On a phone, the viewer and organizer cricket pages should read as one calm, continuous scorecard: score details stack naturally, table headers and rows remain legible, and secondary sections are separated by measured space rather than nested outlined boxes. On laptop and desktop, the existing card borders, backgrounds, padding, and gaps remain exactly as designed.
