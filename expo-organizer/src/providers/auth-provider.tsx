import * as SecureStore from "expo-secure-store";
import { onAuthStateChanged, signInWithCustomToken, type User } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { auth, functions } from "@/lib/firebase";

type AuthContextValue = { user: User | null; loading: boolean; login: (name: string, pin: string) => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);
async function installationId() { const key = "organizer-installation"; const current = await SecureStore.getItemAsync(key); if (current) return current; const value = crypto.randomUUID(); await SecureStore.setItemAsync(key, value); return value; }
export function AuthProvider({ children }: PropsWithChildren) { const [user, setUser] = useState<User | null>(auth.currentUser); const [loading, setLoading] = useState(true); useEffect(() => onAuthStateChanged(auth, (next) => { setUser(next); setLoading(false); }), []); const value = useMemo<AuthContextValue>(() => ({ user, loading, login: async (name, pin) => { const callable = httpsCallable<{ displayName: string; pin: string; installationId: string }, { token: string }>(functions, "organizerLogin"); const result = await callable({ displayName: name, pin, installationId: await installationId() }); await signInWithCustomToken(auth, result.data.token); await SecureStore.setItemAsync("organizer-name", name); } }), [loading, user]); return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>; }
export function useOrganizerAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useOrganizerAuth must be used inside AuthProvider"); return value; }
