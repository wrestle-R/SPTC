import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, doc, onSnapshot, type DocumentData } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db, publicPath } from "@/lib/firebase";

export function usePublicCollection<T extends DocumentData>(name: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const key = `public-${name}`;
    AsyncStorage.getItem(key).then((cached) => {
      if (cached) setData(JSON.parse(cached) as T[]);
    }).finally(() => setLoading(false));
    return onSnapshot(collection(db, publicPath(name)), (snapshot) => {
      const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as unknown as T);
      setData(rows); setLoading(false); setError(null);
      void AsyncStorage.setItem(key, JSON.stringify(rows));
    }, (cause) => { setError(cause.message); setLoading(false); });
  }, [name]);
  return { data, loading, error };
}

export function usePublicDocument<T extends DocumentData>(name: string, id: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const key = `public-${name}-${id}`;
    AsyncStorage.getItem(key).then((cached) => { if (cached) setData(JSON.parse(cached) as T); }).finally(() => setLoading(false));
    return onSnapshot(doc(db, publicPath(name, id)), (snapshot) => {
      const value = snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as unknown as T) : null;
      setData(value); setLoading(false); setError(null);
      if (value) void AsyncStorage.setItem(key, JSON.stringify(value));
    }, (cause) => { setError(cause.message); setLoading(false); });
  }, [id, name]);
  return { data, loading, error };
}
