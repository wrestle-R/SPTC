import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadLocalEnv() {
  const path = resolve(process.cwd(), ".env.local");
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    process.env[key] ??= value;
  }
}

async function main() {
  loadLocalEnv();
  const { seedBaseTournamentData } = await import("../lib/command-handlers");
  const { supabaseAdmin } = await import("../lib/supabase-admin");
  const result = await seedBaseTournamentData();
  const { count, error } = await supabaseAdmin.from("matches").select("id", { count: "exact", head: true });
  if (error) throw error;
  console.log(JSON.stringify({ ...result, matchCount: count ?? 0 }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
