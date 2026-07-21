"use client";

import { publicTournamentPath } from "@sports-fiesta/firebase";
import {
  collection,
  doc,
  onSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/firebase";

interface LiveData<T> {
  data: T;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function usePublicCollection<T extends DocumentData>(
  collectionName: string,
): LiveData<T[]> {
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
    const source = collection(db, publicTournamentPath(collectionName));
    const timeout = window.setTimeout(() => setLoading(false), 4000);
    const unsubscribe = onSnapshot(source, (snapshot) => {
      setData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as unknown as T));
      setLoading(false);
    }, (snapshotError) => {
      console.error(snapshotError);
      setError("Failed to load data. Please check your connection or permissions.");
      setLoading(false);
    });
    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [collectionName, version]);

  return { data, loading, error, retry };
}

export function usePublicDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
): LiveData<T | null> {
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
    const unsubscribe = onSnapshot(doc(db, publicTournamentPath(collectionName, documentId)), (snapshot) => {
      setData(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as unknown as T) : null);
      setError(null);
      setLoading(false);
    }, (snapshotError) => {
      console.error(snapshotError);
      setError("Failed to load data. Please check your connection or permissions.");
      setLoading(false);
    });
    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [collectionName, documentId, version]);

  return { data, loading, error, retry };
}
