import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, doc, onSnapshot, type DocumentData } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db, privatePath } from "@/lib/firebase";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function usePrivateCollection<T extends DocumentData>(name: string) { const [data, setData] = useState<T[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); useEffect(() => { const key = `private-${name}`; AsyncStorage.getItem(key).then((cached) => { if (cached) setData(JSON.parse(cached) as T[]); }).finally(() => setLoading(false)); return onSnapshot(collection(db, privatePath(name)), (snapshot) => { const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as unknown as T); setData(rows); setLoading(false); setError(null); void AsyncStorage.setItem(key, JSON.stringify(rows)); }, (cause) => { setError(cause.message); setLoading(false); }); }, [name]); return { data, loading, error }; }
export function usePrivateDocument<T extends DocumentData>(name: string, id: string) { const [data, setData] = useState<T | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); useEffect(() => onSnapshot(doc(db, privatePath(name, id)), (snapshot) => { setData(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as unknown as T) : null); setLoading(false); setError(null); }, (cause) => { setError(cause.message); setLoading(false); }), [id, name]); return { data, loading, error }; }
export function useTournament<T extends DocumentData>() { const [data, setData] = useState<T | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); useEffect(() => onSnapshot(doc(db, privatePath()), (snapshot) => { setData(snapshot.exists() ? (snapshot.data() as T) : null); setLoading(false); setError(null); }, (cause) => { setError(cause.message); setLoading(false); }), []); return { data, loading, error }; }
export async function command<T = unknown>(name: string, data: Record<string, unknown> = {}) {
  const baseUrl = API_URL?.replace(/\/+$/, "");
  if (!baseUrl) throw new Error("Set EXPO_PUBLIC_API_URL in .env.local to point to the Next.js server.");
  const response = await fetch(`${baseUrl}/api/organizer/command`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ command: name, data }),
  });
  const body = await response.json() as { result?: T; error?: { message: string } };
  if (!response.ok || body.error) throw new Error(body.error?.message ?? `Command failed (${response.status}).`);
  return body.result as T;
}
export function revision(match: MatchLike, data: Record<string, unknown> = {}) { return { ...data, matchId: match.id, expectedRevision: match.revision, commandId: crypto.randomUUID() }; }
type MatchLike = { id: string; revision: number };
