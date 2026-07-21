import { readFileSync } from "fs";
import { resolve } from "path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) return;
  const key = trimmed.slice(0, eqIndex);
  const value = trimmed.slice(eqIndex + 1);
  if (!process.env[key]) process.env[key] = value;
});

const TOURNAMENT_ID = "sports-fiesta-s9";

function initApp() {
  if (getApps().length) return;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    initializeApp({ credential: cert(JSON.parse(key)) });
    return;
  }
  initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
}

async function listMatches() {
  initApp();
  const db = getFirestore();

  console.log("=== PRIVATE MATCHES ===");
  const privateSnap = await db.collection("tournaments").doc(TOURNAMENT_ID).collection("matches").get();
  privateSnap.forEach((doc) => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | matchNumber: ${data.matchNumber} | status: ${data.status} | sport: ${data.sport}`);
  });

  console.log("\n=== PUBLIC MATCHES ===");
  const publicSnap = await db.collection("publicTournaments").doc(TOURNAMENT_ID).collection("matches").get();
  publicSnap.forEach((doc) => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | matchNumber: ${data.matchNumber} | status: ${data.status} | sport: ${data.sport}`);
  });
}

listMatches().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
