import { S9_PLAYERS, S9_SPORTS, S9_TEAMS } from "@sports-fiesta/domain";
import { FieldValue } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import { requireOrganizer } from "./auth.js";
import { REGION, TOURNAMENT_ID } from "./constants.js";
import { db, privateCollection, privateRoot, publicCollection, publicRoot } from "./firebase.js";

export const bootstrapTournament = onCall({ region: REGION }, async (request) => {
  const actor = requireOrganizer(request);
  const existing = await privateRoot.get();
  if (existing.exists && existing.data()?.bootstrapped === true) {
    return { bootstrapped: false, reason: "already-exists" };
  }

  const batch = db.batch();
  const tournament = {
    id: TOURNAMENT_ID,
    name: "Sports Fiesta S9",
    season: "S9",
    organizer: "SPTC",
    startDate: null,
    endDate: null,
    venues: [],
    cricketOvers: 5,
    placementPoints: {
      football: [10, 5, 3, 1],
      handball: [10, 5, 3, 1],
      cricket: [10, 5, 3, 1],
    },
    bootstrapped: true,
    bootstrappedBy: actor.name,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  batch.set(privateRoot, tournament);
  batch.set(publicRoot, { ...tournament, bootstrappedBy: undefined });

  for (const team of S9_TEAMS) {
    batch.set(privateCollection("teams").doc(team.id), team);
    batch.set(publicCollection("teams").doc(team.id), team);
  }
  for (const player of S9_PLAYERS) {
    batch.set(privateCollection("players").doc(player.id), player);
    batch.set(publicCollection("players").doc(player.id), player);
  }
  for (const sport of S9_SPORTS) {
    const data = { ...sport, fixturesConfirmed: false };
    batch.set(privateCollection("sports").doc(sport.id), data);
    batch.set(publicCollection("sports").doc(sport.id), data);
  }
  const emptyRows = S9_TEAMS.map((team, index) => ({
    rank: index + 1,
    teamId: team.id,
    football: 0,
    handball: 0,
    cricket: 0,
    discipline: 0,
    total: 0,
  }));
  batch.set(publicCollection("standings").doc("overall"), { rows: emptyRows });
  batch.set(publicCollection("standings").doc("football"), { rows: [] });
  batch.set(publicCollection("standings").doc("handball"), { rows: [] });
  batch.set(publicCollection("standings").doc("cricket"), { rows: [] });
  await batch.commit();
  return { bootstrapped: true, teams: S9_TEAMS.length, players: S9_PLAYERS.length };
});
