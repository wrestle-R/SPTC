"use client";

import { usePublicCollection, usePublicDocument } from "@/lib/public-data";
import type { CollectionName } from "@/lib/supabase-admin";

export function usePrivateCollection<T>(collectionName: CollectionName) {
  return usePublicCollection<T>(collectionName);
}

export function usePrivateDocument<T>(collectionName: CollectionName, documentId: string) {
  return usePublicDocument<T>(collectionName, documentId);
}

export function usePrivateTournament<T>() {
  return usePublicDocument<T>("tournament_settings", "sports-fiesta-s9");
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
