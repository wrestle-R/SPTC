"use client";

import { privateTournamentPath } from "@sports-fiesta/firebase";
import { collection, doc, onSnapshot, type DocumentData } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/firebase";

type LiveData<T> = { data: T; loading: boolean; error: string | null; retry: () => void };

export function usePrivateCollection<T extends DocumentData>(collectionName: string): LiveData<T[]> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setVersion((value) => value + 1);
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 4000);
    const unsubscribe = onSnapshot(collection(db, privateTournamentPath(collectionName)), (snapshot) => {
      setData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as unknown as T));
      setLoading(false);
      setError(null);
    }, (snapshotError) => {
      console.error(snapshotError);
      setError("Failed to load data. Please check your connection or permissions.");
      setLoading(false);
    });
    return () => { window.clearTimeout(timeout); unsubscribe(); };
  }, [collectionName, version]);
  return { data, loading, error, retry };
}

export function usePrivateDocument<T extends DocumentData>(collectionName: string, documentId: string): LiveData<T | null> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setVersion((value) => value + 1);
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 4000);
    const unsubscribe = onSnapshot(doc(db, privateTournamentPath(collectionName, documentId)), (snapshot) => {
      setData(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as unknown as T) : null);
      setLoading(false);
      setError(null);
    }, (snapshotError) => {
      console.error(snapshotError);
      setError("Failed to load data. Please check your connection or permissions.");
      setLoading(false);
    });
    return () => { window.clearTimeout(timeout); unsubscribe(); };
  }, [collectionName, documentId, version]);
  return { data, loading, error, retry };
}

export function usePrivateTournament<T extends DocumentData>(): LiveData<T | null> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setVersion((value) => value + 1);
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 4000);
    const unsubscribe = onSnapshot(doc(db, privateTournamentPath()), (snapshot) => {
      setData(snapshot.exists() ? (snapshot.data() as T) : null);
      setLoading(false);
      setError(null);
    }, (snapshotError) => {
      console.error(snapshotError);
      setError("Failed to load data. Please check your connection or permissions.");
      setLoading(false);
    });
    return () => { window.clearTimeout(timeout); unsubscribe(); };
  }, [version]);
  return { data, loading, error, retry };
}

export async function callOrganizerCommand<T>(name: string, data: Record<string, unknown> = {}) {
  const response = await fetch("/api/organizer/command", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ command: name, data }),
  });
  const body = await response.json() as { result?: T; error?: { message: string } };
  if (!response.ok || body.error) throw new Error(body.error?.message ?? "An unexpected error occurred.");
  return body.result as T;
}

export function revisionCommand(matchId: string, expectedRevision: number, data: Record<string, unknown> = {}) {
  return { ...data, matchId, expectedRevision, commandId: crypto.randomUUID() };
}
