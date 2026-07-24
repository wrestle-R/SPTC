import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadLocalEnv() {
  const path = [".env.local", ".env"].map((file) => resolve(process.cwd(), file)).find(existsSync);
  if (!path) throw new Error("Create .env.local or .env with the Supabase credentials first.");
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    process.env[trimmed.slice(0, index)] ??= trimmed.slice(index + 1);
  }
}

async function main() {
  loadLocalEnv();
  const [{ S9_SEEDED_MATCHES }, { supabaseAdmin }] = await Promise.all([
    import("@sports-fiesta/domain"),
    import("../lib/supabase-admin"),
  ]);
  const timestamp = new Date().toISOString();
  const rows = S9_SEEDED_MATCHES.map((match) => ({
    id: match.id,
    data: { ...match, createdAt: timestamp, updatedAt: timestamp },
  }));
  const { error } = await supabaseAdmin.from("matches").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  const { data, error: verificationError } = await supabaseAdmin
    .from("matches")
    .select("id")
    .in("id", rows.map((row) => row.id));
  if (verificationError) throw verificationError;
  if (data.length !== rows.length) throw new Error(`Expected ${rows.length} fixtures, found ${data.length}.`);
  console.log(`Upserted and verified ${data.length} fixtures.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
