import { collection, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const tournamentId = "sports-fiesta-s9";

export const tournamentDoc = doc(db, "tournaments", tournamentId);
export const teamsCollection = collection(tournamentDoc, "teams");
export const eventsCollection = collection(tournamentDoc, "events");
export const fixturesCollection = collection(tournamentDoc, "fixtures");
export const standingsCollection = collection(tournamentDoc, "standings");
export const playersCollection = collection(tournamentDoc, "players");
export const leaderboardsCollection = collection(tournamentDoc, "leaderboards");
export const disciplineCollection = collection(tournamentDoc, "discipline");
export const auditTrailCollection = collection(tournamentDoc, "auditTrail");
export const organizersCollection = collection(tournamentDoc, "organizers");
