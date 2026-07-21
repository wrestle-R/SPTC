import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { TOURNAMENT_ID } from "./constants.js";

if (getApps().length === 0) initializeApp();

export const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

export const privateRoot = db.collection("tournaments").doc(TOURNAMENT_ID);
export const publicRoot = db.collection("publicTournaments").doc(TOURNAMENT_ID);

export const privateCollection = (name: string) => privateRoot.collection(name);
export const publicCollection = (name: string) => publicRoot.collection(name);
