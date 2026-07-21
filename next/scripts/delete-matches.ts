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
const DOC_IDS_TO_DELETE = ["v7rq0IAWbTGWKsQvlwoo", "t7ZlDXpBxOdQAFtaegkZ"];

function initApp() {
  if (getApps().length) return;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    initializeApp({ credential: cert(JSON.parse(key)) });
    return;
  }
  initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
}

async function deleteMatches() {
  initApp();
  const db = getFirestore();

  const privateRoot = db.collection("tournaments").doc(TOURNAMENT_ID);
  const publicRoot = db.collection("publicTournaments").doc(TOURNAMENT_ID);

  for (const docId of DOC_IDS_TO_DELETE) {
    console.log(`Deleting match ${docId}...`);

    const privateDoc = privateRoot.collection("matches").doc(docId);
    const privateSnap = await privateDoc.get();
    if (privateSnap.exists) {
      await privateDoc.delete();
      console.log(`  ✓ Deleted from private collection`);
    } else {
      console.log(`  - Not found in private collection`);
    }

    const publicDoc = publicRoot.collection("matches").doc(docId);
    const publicSnap = await publicDoc.get();
    if (publicSnap.exists) {
      await publicDoc.delete();
      console.log(`  ✓ Deleted from public collection`);
    } else {
      console.log(`  - Not found in public collection`);
    }
  }

  console.log("\nDone! Both matches deleted.");
}

deleteMatches().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
