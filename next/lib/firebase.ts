import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBgutHYDEpkmEKY8tBEKgP1lzJ8ul4P1O4",
  authDomain: "sptc-2cb8a.firebaseapp.com",
  projectId: "sptc-2cb8a",
  storageBucket: "sptc-2cb8a.firebasestorage.app",
  messagingSenderId: "22202265022",
  appId: "1:22202265022:web:f43d6846fc60c12aed9def",
  measurementId: "G-RN0KTQDNTE",
};

export const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") {
    return null;
  }

  return (await isSupported()) ? getAnalytics(app) : null;
}
