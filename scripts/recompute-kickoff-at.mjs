import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { kickoffAtIsoFromFixture } from "../lib/kickoff.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const { data: fixtures, error } = await supabase
  .from("fixtures")
  .select("id,date_label,time");

if (error) {
  console.error(error.message);
  process.exit(1);
}

let updated = 0;
for (const row of fixtures ?? []) {
  const kickoff_at = kickoffAtIsoFromFixture({
    dateLabel: row.date_label,
    time: row.time,
  });
  if (!kickoff_at) {
    console.warn("Skipped (bad date/time):", row.id);
    continue;
  }

  const { error: updateErr } = await supabase
    .from("fixtures")
    .update({ kickoff_at })
    .eq("id", row.id);

  if (updateErr) {
    console.error(row.id, updateErr.message);
    continue;
  }
  updated += 1;
}

console.log(`Recomputed kickoff_at (Nepal Time) for ${updated} fixtures.`);
