import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { kickoffAtIsoFromFixture } from "../lib/kickoff.mjs";

async function loadDotEnvIfPresent(root, filename) {
  const full = path.join(root, filename);
  if (!existsSync(full)) return;
  const raw = await readFile(full, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function main() {
  const root = process.cwd();
  // Node scripts don't auto-load .env files; load them explicitly.
  await loadDotEnvIfPresent(root, ".env.local");
  await loadDotEnvIfPresent(root, ".env");

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const jsonPath = path.join(root, "data", "fixtures.json");
  const raw = await readFile(jsonPath, "utf8");
  const fixtures = JSON.parse(raw);

  const rows = fixtures.map((f) => ({
    id: f.id,
    date_label: f.dateLabel,
    time: f.time,
    home: f.home,
    away: f.away,
    stage: f.stage ?? null,
    group: f.group ?? null,
    stadium: f.stadium ?? null,
    city: f.city ?? null,
    kickoff_at: f.kickoffAt ?? kickoffAtIsoFromFixture({ dateLabel: f.dateLabel, time: f.time }),
  }));

  // Upsert in chunks to avoid payload limits.
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("fixtures").upsert(chunk, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  console.log(`Seeded ${rows.length} fixtures into public.fixtures`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

