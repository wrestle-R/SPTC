import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const TOURNAMENT_ID = "sports-fiesta-s9";

function init() {
  if (!getApps().length) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (key) {
      try { initializeApp({ credential: cert(JSON.parse(key)) }); return; }
      catch { console.warn("Invalid FIREBASE_SERVICE_ACCOUNT_KEY, falling back to ADC"); }
    }
    initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }
}

async function deleteAllMatches() {
  init();
  const db = getFirestore();
  const root = db.collection("tournaments").doc(TOURNAMENT_ID);
  const pubRoot = db.collection("publicTournaments").doc(TOURNAMENT_ID);

  for (const [label, parent] of [["private", root], ["public", pubRoot]]) {
    const snapshot = await parent.collection("matches").get();
    console.log(`${label}: ${snapshot.docs.length} matches found`);
    const batch = db.batch();
    let count = 0;
    for (const doc of snapshot.docs) {
      const events = await doc.ref.collection("events").listDocuments();
      for (const eventRef of events) batch.delete(eventRef);
      batch.delete(doc.ref);
      count++;
      if (count % 400 === 0) { await batch.commit(); batch = db.batch(); }
    }
    if (count > 0) await batch.commit();
    console.log(`${label}: deleted ${count} matches`);
  }
  console.log("Done.");
}

deleteAllMatches().catch(console.error);
