import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

function required(name: string, value?: string) { if (!value) throw new Error(`Missing ${name}. Add it to .env.local.`); return value; }
const config = { apiKey: required("EXPO_PUBLIC_FIREBASE_API_KEY", process.env.EXPO_PUBLIC_FIREBASE_API_KEY), authDomain: required("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN", process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN), projectId: required("EXPO_PUBLIC_FIREBASE_PROJECT_ID", process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID), storageBucket: required("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET", process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET), messagingSenderId: required("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID), appId: required("EXPO_PUBLIC_FIREBASE_APP_ID", process.env.EXPO_PUBLIC_FIREBASE_APP_ID) };
export const app = getApps().length ? getApp() : initializeApp(config);
export const db = getFirestore(app);
export const functions = getFunctions(app, "asia-south1");
export const privatePath = (...segments: string[]) => ["tournaments", "sports-fiesta-s9", ...segments].join("/");
