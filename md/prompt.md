# Sports Fiesta S9 — Master Build Prompt

Copy everything below into your Antigravity agent to build the app.

---

Build a mobile app called **"Sports Fiesta S9"** for our church's intra-church sports tournament, happening this Saturday. Build it with **Expo (React Native)** so it produces one codebase that runs on **both iOS and Android** — use the Expo Go app (or a dev build) so it can be tested on both platforms from the same project. Use a **real backend database** (SQLite is fine to start, Postgres if it's easy to set up) — never local-only/device-only storage, since organizers and viewers all need to see the same live data. Set up the Expo project, install dependencies, and run it yourself (editor + terminal) rather than describing steps for me to run manually — confirm it actually starts and renders before moving on to the next section.

This is a big, detailed spec. Build it carefully, in this order: **1) Access system → 2) Dashboard/navigation → 3) Football & Handball → 4) Cricket → 5) Discipline points → 6) Viewer experience polish.** Ask me before making assumptions on anything not covered below.

---

## 1. Teams (fixed, seed on first run)

| Team | Color |
|---|---|
| ⚫ Karuppu Knights | Black |
| 🟢 God's Gladiators | Green |
| ⚪ Ivory Elites | White |
| 🔴 Crimson Warriors | Red |

## 2. Team Rosters (seed data — PROVISIONAL, minor swaps still coming, keep this easy to edit later)

Store each player against their team so they can be picked from a dropdown anywhere a name is needed (goal scorer, batter, bowler, discipline points), instead of typed free text.

**🔴 Red (Crimson Warriors):** Daniel Russel Paul, Glen Gladin, Sam Jeyaraj, Jovin Samraj, Melvin Benn, Aaron Ditto, Johan Jagdish, Jenson Shaji, Daniel Ratnaraj, Edwin Anburaj, Jemima John, Rachel Edwin, Hannah Mano, Sharon Jane, Cressida Jebastin, Suja Jebakumar, Christy Jagdish, Kaitlyn Eve

**🟢 Green (God's Gladiators):** Patrick Joshua, Edben Kruze, Jeshurun Edwin, John Rajesh, Febin Jagdish, Jeffrey Jebakumar, Eric Edison, Ditto Lazar, Benson Wilson, Joselin Daniel, Rheanna Robinson, Maria Antony, Andrea Joyal, Jyotimani Wilson, Esther Robins, Sumitha Jackson, Candice Jebastin, Judith John

**⚫ Black (Karuppu Knights):** Jonathan Kirubaharan, Jerome Jebakumar, Terry Aldrin, Jagdish, Leroy Kinskumar, Abraham Joyal, Ethan Russel, Robins Duncan, Jackson Andrews, Eunice Edison, Celeste Ditto, Euvance Edison, Joselin Golda, Jas Johh, Jency Sony, Stella Daniel, Ansel James

**⚪ White (Ivory Elites):** Sheldon Benson, Harrison Peter, Akshay James, Immanuel J, Kevin Joash, Frederick John, Jovin Daniel, Austin Sundarraj, Robinson Samuel, Jebakumar, Jebastin David, Alecia Wilson, Johannah Jackson, Andrea Prakash, Rhowena Robinson, Rani Edwin, Geeta Benson, Thulasi Edwin, Annette Maria

Build a simple admin screen (accessible only to the admin organizer, see section 3) to add/edit/remove roster players later, since this list will change.

---

## 3. Access System — Viewer vs Organizer

**No accounts, no typed usernames, no repeated logins.** Behavior:

1. **First time the app is ever opened on a phone**, show one screen with two big buttons: **"I'm a Viewer"** and **"I'm an Organizer."** Whichever is tapped is remembered on that device forever — this screen never shows again on that phone.
2. **Viewer** → goes straight into the read-only app (see section 8). Nothing more needed, ever.
3. **Organizer** → shown a list of 11 names to pick from, then asked to enter that person's PIN. Each PIN can be successfully used **exactly once, ever** — the backend marks it "claimed" the instant it's correctly entered. After that:
   - That device is permanently signed in as that organizer — no logout button anywhere in the app, no re-entry ever needed again.
   - If anyone (including that same person on a different device) tries that PIN again, the app simply says "This code has already been used" and refuses.
4. Every organizer name/PIN pair (seed these, hardcoded, exactly these 11 — no sign-up flow exists, so there is no way for a 12th person to ever get in):

| Organizer | PIN |
|---|---|
| Patrick | 20261 |
| Jeffery | 20262 |
| Aadu | 20263 |
| Abu | 20264 |
| Glen | 20265 |
| Jerome | 20266 |
| Jeshu | 20267 |
| Pogs | 20268 |
| Jovin | 20269 |
| Sheldon | 202610 |
| Fred | 202611 |

5. **Patrick is the admin.** When Patrick's PIN is used, in addition to normal organizer access, he gets an extra **"Manage Organizers"** screen listing all 11 names with a "Reset/Unclaim" button next to each — lets him free up a PIN again if someone's phone breaks, or during testing this week. No one else sees this option.
6. Every score/points update made by an organizer should be tagged with **who made it** (their name), stored alongside the change, so there's always a trail of who did what.

---

## 4. App Navigation Structure

Top-level **Events** screen (same for viewers and organizers, minus edit ability for viewers) listing all 7 tournament events:

- ⚽ Football — fully functional (section 6)
- 🏏 Cricket — fully functional (section 7)
- 🤾 Handball — fully functional, identical rules/UI to Football, just a separate data set (section 6 applies to both)
- 🏐 Throwball — "Coming soon" placeholder screen
- 🏃 Relay Race — "Coming soon" placeholder screen
- 👧 Kids' Game — "Coming soon" placeholder screen
- 👩 Women's Game — "Coming soon" placeholder screen

Placeholders should be simple and honest — no fake data, no broken buttons, just "Coming soon" and a return button.

---

## 5. Dashboard (home screen, inside Events, top of the app)

- **Team Chart card**: a combined leaderboard — every team's total points from Football + Cricket + Handball + Discipline Points, all added together. Shown as a **bar graph where each team's bar is segmented/colored by source** (e.g. one color for football points, another for cricket, another for handball, another for discipline points), so you can see at a glance where a team's score is coming from.
  - Tapping the card opens a full standings screen with the same breakdown in more detail.
- Organizers additionally see a **floating button, bottom-right, on every screen**, for Discipline Points (section 5a).

### 5a. Discipline Points (organizer-only floating button)

- Tapping it opens a small popup form: **Team** (dropdown), **Points** (number, can be positive or negative), **Reason** (short text), **Submit**.
- On submit, it adds (or subtracts) from that team's combined total, tagged with which organizer submitted it and the reason.
- Viewers can see these in full, including the reason text — full transparency, not hidden.

---

## 6. Football & Handball (identical rules — build once, reuse for both as separate datasets)

### Fixtures
- The admin (Patrick) manually creates the group-stage fixtures — a form to pick Team A vs Team B, repeated for all 6 round-robin matchups (every team plays every other team once).
- A **"Confirm Fixtures"** action locks the schedule. After confirming, no organizer except Patrick can edit the fixture list (add/remove/change matchups). Patrick can still edit if needed.

### Group Stage & Progression
- Standings ranked by **number of wins**.
- **Top 2 teams by wins go straight to the Final.**
- **If 2nd and 3rd place are tied on wins**, they play a **decider match** — winner takes the final qualifying spot. (Ties elsewhere, e.g. 1st/2nd, don't need a decider since both already qualify.)
- Build a **knockout bracket diagram** (like a simplified World Cup bracket): Group Stage box at top → narrows to Decider Match (only shown if it happens) → narrows to Final → ends in a Champion/trophy badge. **Tapping any stage in the bracket opens that match's live score/details**, same as tapping a fixture. Update it automatically as results come in.

### Live Match Scoring (organizer, event-based — no running match clock)
When an organizer opens a fixture, they can start live-scoring it:
- **Goal** button → pick team → pick scorer from that team's roster → score updates instantly.
- **Own Goal** button → pick the player who scored it on themselves → goal is correctly credited to the *other* team.
- **Yellow Card** button → pick team → pick player.
- **Red Card** button → pick team → pick player. (No auto-escalation — a 2nd yellow does NOT automatically become a red; track them independently.)
- **Undo** button — removes the last action, for scorer mistakes.
- No match timer/clock anywhere — just an event log building up the score live.

### Final Tiebreaker
- If the Final ends in a draw, go **straight to a penalty shootout** — no extra time.
- Shootout format: **best-of-5 kicks each team, then sudden death** if still tied after 5. Reuse the same tap-to-score interaction (goal/miss per kicker) to track it.

---

## 7. Cricket (full ball-by-ball live scoring engine)

### Format
- **5 overs per innings**, two innings per match (each team bats once).
- **No fixed squad size** — players are added to the scoring screen as they come in to bat or bowl, picked from that team's roster.
- Innings ends when 5 overs are complete, **or** manually via an **"All Out / End Innings"** button if the batting team runs out of available players before the overs are up.
- A bowler **cannot bowl two overs back-to-back**, but there's no cap on total overs bowled by one player across the innings.

### Ball-by-Ball Scoring
For every delivery, the organizer taps:
- **Runs**: 0, 1, 2, 3, 4, 6
- **Wide** → +1 run, ball is replayed (doesn't count toward the over)
- **No Ball** → +1 run, ball is replayed (doesn't count toward the over)
- **Bye / Leg Bye** → runs added as extras, ball counts normally
- **Dead Ball** → nothing counted, ball is simply redone (no run, no penalty)
- **Wicket** → pick dismissal type: **Bowled, Caught, Run Out, Stumped, or Hit Wicket** (no LBW)

### Automatic Behavior (must be calculated, never manually entered)
- **Striker/non-striker automatically swap**: on odd runs (1, 3, 5) batters cross, and at the end of every completed over. The organizer never manually flips who's on strike.
- Live team score, wickets, overs bowled, run rate, and (in the 2nd innings) target and required run rate.
- Every batter's runs, balls faced, 4s, 6s, strike rate — calculated live from the ball data.
- Every bowler's overs, runs conceded, wickets, economy — calculated live from the ball data.
- **Undo last ball** — for scorer mistakes, must correctly reverse score/stats/strike rotation.

### Tie-Breaker: Super Over
- If scores are level after both innings, play a **real Super Over**: 1 extra over per team, using the exact same ball-by-ball scorer.
- **If the Super Over is ALSO tied — leave this as an open placeholder for now** (e.g. a simple "Tie — resolution TBD" state); I'll give you the exact rule for this later. Don't block the rest of the build on it.

### Leaderboards & Awards (auto-generated from the ball-by-ball data, all "now," not deferred)
- **Orange Cap** — most runs across the tournament
- **Purple Cap** — most wickets across the tournament
- Points table, match results, match summaries
- **Explicitly do NOT build**: text commentary, wagon wheel, pitch map, worm/Manhattan/partnership graphs, fielder-specific attribution (catch by/run out by), powerplay/middle-overs/death-overs breakdown. These were considered and deliberately cut — not a later phase, just not wanted at all.

---

## 8. Viewer Experience (read-only)

- Viewers land on the same Events screen, but see **zero edit controls anywhere** — not even greyed out, just not present, so there's nothing confusing to tap.
- Home screen shows a **big "LIVE NOW" banner/card** at the top spotlighting whichever match (any sport) is currently being scored, so viewers don't have to hunt for it.
- Scores **auto-refresh in the background every few seconds** while the app is open — no manual pull-to-refresh needed.
- Full access to: standings, the knockout bracket, all leaderboards (Orange Cap, Purple Cap, top scorer, team chart), and discipline points **including the reason text** — same transparency organizers get.
- **Design priority: simple and readable for every age group**, including elderly viewers. Big text, big tap targets, one clear takeaway per screen (e.g. "Red is winning") rather than dense tables of numbers. Avoid clutter and overly technical presentation — friendly and clear over "impressive."

---

## 9. Design & Technical Requirements

- **Fully responsive** — must work correctly on every phone screen size/resolution without overflowing or clipping content. Test this carefully; this was a specific problem in earlier testing.
- Dark, scoreboard-style visual theme. Team colors as accents — the black team's accent should be a visible light grey/silver, not pure black, so it's readable on a dark background.
- A logo and branded loading screen are wanted eventually, but **not required for this build** — use a simple placeholder for now.
- This app needs to be reliable for **this Saturday** — prioritize correctness and stability over extra polish. If something in this spec is ambiguous or you're about to guess, ask instead of assuming.

---
### Problem Statement

Church-organized sports tournaments are often managed using paper score sheets, spreadsheets, and messaging apps, making it difficult to track live scores, fixtures, player statistics, and team standings in one place. As multiple organizers update results simultaneously, information can become inconsistent, delayed, or lost, while spectators have no reliable way to follow ongoing matches in real time. Additionally, managing multiple sports with different scoring systems—such as football, handball, and cricket—requires separate manual processes, increasing the chances of errors and reducing transparency.

There is a need for a centralized, real-time tournament management system that enables authorized organizers to securely record match events, automatically update standings and player statistics, and provide spectators with live, read-only access to scores, fixtures, brackets, leaderboards, and tournament progress. The system should support multiple sports with sport-specific scoring rules, ensure data consistency through a shared backend, maintain an audit trail of organizer actions, and deliver an intuitive experience for users of all age groups. 

