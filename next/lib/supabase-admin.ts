import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

export type JsonDocument = Record<string, unknown>;
type JsonLike = object;

export type CollectionName =
  | "tournament_settings"
  | "sports"
  | "teams"
  | "players"
  | "matches"
  | "awards"
  | "standings"
  | "leaderboards"
  | "brackets"
  | "command_receipts";

function requiredEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

export const supabaseAdmin = createClient(
  requiredEnv("SUPABASE_URL", process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL),
  requiredEnv("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: WebSocket as never,
    },
  },
);

export class CommandError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
  }
}

export function nowIso() {
  return new Date().toISOString();
}

export function newId() {
  return crypto.randomUUID();
}

export async function listDocuments<T extends JsonDocument>(table: CollectionName) {
  const { data, error } = await supabaseAdmin.from(table).select("id,data").order("id");
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, ...(row.data as T) })) as T[];
}

export async function getDocument<T extends JsonDocument>(table: CollectionName, id: string) {
  const { data, error } = await supabaseAdmin.from(table).select("id,data").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? ({ id: data.id, ...(data.data as T) } as T) : null;
}

export async function upsertDocument(table: CollectionName, id: string, value: JsonLike) {
  const { error } = await supabaseAdmin.from(table).upsert({ id, data: value }, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteDocument(table: CollectionName, id: string) {
  const { error } = await supabaseAdmin.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function updateMatchByRevision(id: string, expectedRevision: number, value: JsonLike) {
  const { data, error } = await supabaseAdmin
    .from("matches")
    .update({ data: value })
    .eq("id", id)
    .eq("revision", expectedRevision)
    .select("id,data")
    .maybeSingle();
  if (error) throw error;
  return data ? ({ id: data.id, ...(data.data as JsonDocument) }) : null;
}
