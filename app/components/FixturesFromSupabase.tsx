"use client";

import { useEffect, useMemo, useState } from "react";
import { FixtureCard } from "@/app/components/FixtureCard";
import { compareByDateAndTime, dateLabelToSortValue, type FixtureMatch } from "@/lib/fixtures";

type FixtureRow = {
  id: string;
  date_label: string;
  time: string;
  home: string;
  away: string;
  stage: string | null;
  group: string | null;
  stadium: string | null;
  city: string | null;
  status: "scheduled" | "pending" | "finished";
  kickoff_at: string | null;
  result_home_score: number | null;
  result_away_score: number | null;
};

function toMatch(r: FixtureRow): FixtureMatch {
  return {
    id: r.id,
    dateLabel: r.date_label,
    time: r.time,
    home: r.home,
    away: r.away,
    stage: r.stage ?? undefined,
    group: r.group ?? undefined,
    stadium: r.stadium ?? undefined,
    city: r.city ?? undefined,
    status: r.status ?? "scheduled",
    kickoffAt: r.kickoff_at ?? undefined,
  };
}

export function FixturesFromSupabase() {
  const [rows, setRows] = useState<FixtureRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/fixtures", { cache: "no-store" }).catch(() => null);
      const json = (await res?.json().catch(() => null)) as
        | { ok: true; fixtures: FixtureRow[] }
        | { ok: false; message: string }
        | null;

      if (!res || !json || !json.ok) {
        setRows([]);
        setLoading(false);
        return;
      }

      setRows(json.fixtures ?? []);
      setLoading(false);
    }

    void load();
  }, []);

  const byDate = useMemo(() => {
    const map: Record<string, FixtureRow[]> = {};
    for (const r of rows) {
      (map[r.date_label] ??= []).push(r);
    }
    for (const key of Object.keys(map)) {
      map[key].sort(compareByDateAndTime);
    }
    return map;
  }, [rows]);

  const sortedDateLabels = useMemo(() => {
    return Object.keys(byDate).sort((a, b) => dateLabelToSortValue(a) - dateLabelToSortValue(b));
  }, [byDate]);

  if (loading) {
    return <div className="text-sm text-zinc-600 dark:text-zinc-400">Loading fixtures…</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        No fixtures found. Seed Supabase fixtures first.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDateLabels.map((dateLabel) => (
        <section key={dateLabel} className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{dateLabel}</h2>

          <div className="grid gap-3">
            {byDate[dateLabel].map((r) => (
              <FixtureCard key={r.id} match={toMatch(r)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

