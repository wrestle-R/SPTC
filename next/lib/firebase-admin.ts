import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const TOURNAMENT_ID = "sports-fiesta-s9";

function initApp() {
  if (getApps().length) return;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    try {
      initializeApp({ credential: cert(JSON.parse(key)) });
      return;
    } catch {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY set but invalid, falling back to ADC");
    }
  }
  initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
}

let _settingsApplied = false;
function getDb() {
  initApp();
  const db = getFirestore();
  if (!_settingsApplied) {
    db.settings({ ignoreUndefinedProperties: true });
    _settingsApplied = true;
  }
  return db;
}

export { FieldValue };

export class CommandError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
  }
}

export function getRefs() {
  const db = getDb();
  const privateRoot = db.collection("tournaments").doc(TOURNAMENT_ID);
  const publicRoot = db.collection("publicTournaments").doc(TOURNAMENT_ID);
  return {
    db,
    privateRoot,
    publicRoot,
    privateCollection: (name: string) => privateRoot.collection(name),
    publicCollection: (name: string) => publicRoot.collection(name),
  };
}
