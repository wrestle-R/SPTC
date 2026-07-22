"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CollectionName } from "@/lib/supabase-admin";

interface LiveData<T> {
  data: T;
  loading: boolean;
  error: string | null;
  retry: () => void;
  mutate: (updateFn: (prev: T) => T) => void;
}

function fromRow<T>(row: { id: string; data: unknown }) {
  return { id: row.id, ...(row.data as object) } as T;
}

export function usePublicCollection<T>(collectionName: CollectionName): LiveData<T[]> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setVersion((value) => value + 1);
  }, []);
  const mutate = useCallback((updateFn: (prev: T[]) => T[]) => {
    setData((prev) => updateFn(prev));
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: rows, error: loadError } = await supabase.from(collectionName).select("id,data").order("id");
      if (!active) return;
      if (loadError) {
        console.error(loadError);
        setError("Failed to load data. Please check your connection or permissions.");
        setLoading(false);
        return;
      }
      setData((rows ?? []).map(fromRow<T>));
      setError(null);
      setLoading(false);
    }
    void load();
    const channel = supabase
      .channel(`public-${collectionName}-${version}`)
      .on("postgres_changes", { event: "*", schema: "public", table: collectionName }, () => void load())
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [collectionName, version]);

  return { data, loading, error, retry, mutate };
}

export function usePublicDocument<T>(collectionName: CollectionName, documentId: string): LiveData<T | null> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setVersion((value) => value + 1);
  }, []);
  const mutate = useCallback((updateFn: (prev: T | null) => T | null) => {
    setData((prev) => updateFn(prev));
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: row, error: loadError } = await supabase.from(collectionName).select("id,data").eq("id", documentId).maybeSingle();
      if (!active) return;
      if (loadError) {
        console.error(loadError);
        setError("Failed to load data. Please check your connection or permissions.");
        setLoading(false);
        return;
      }
      setData(row ? fromRow<T>(row) : null);
      setError(null);
      setLoading(false);
    }
    void load();
    const channel = supabase
      .channel(`public-${collectionName}-${documentId}-${version}`)
      .on("postgres_changes", { event: "*", schema: "public", table: collectionName, filter: `id=eq.${documentId}` }, () => void load())
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [collectionName, documentId, version]);

  return { data, loading, error, retry, mutate };
}
