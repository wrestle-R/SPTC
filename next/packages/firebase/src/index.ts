import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

export const TOURNAMENT_ID = "sports-fiesta-s9";

export interface PublicFirebaseConfig extends FirebaseOptions {
  projectId: string;
}

export function createFirebaseClient(config: PublicFirebaseConfig) {
  const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config);
  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    functions: getFunctions(app, "asia-south1"),
    storage: getStorage(app),
  };
}

export const publicTournamentPath = (...segments: string[]) =>
  ["publicTournaments", TOURNAMENT_ID, ...segments].join("/");

export const privateTournamentPath = (...segments: string[]) =>
  ["tournaments", TOURNAMENT_ID, ...segments].join("/");
