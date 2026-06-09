"use client";

import { useEffect, useState } from "react";

type LeaderRow = {
  email: string;
  predicted: number;
  correct: number;
  incorrect: number;
  draw: number;
  points?: number;
};

function LeaderboardCard({ row, rank }: { row: LeaderRow; rank: number }) {
  const shortEmail = row.email.split("@")[0] ?? row.email;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] tabular-nums text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10">
            {rank}
          </span>
          <span className="truncate text-sm text-zinc-900 dark:text-zinc-50" title={row.email}>
            {shortEmail}
          </span>
        </div>
        <span className="shrink-0 text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
          {row.points ?? 0} pts
        </span>
      </div>
      <dl className="mt-2.5 grid grid-cols-4 gap-1 text-center">
        {[
          ["Pred", row.predicted ?? 0],
          ["Hit", row.correct],
          ["Miss", row.incorrect],
          ["Draw", row.draw],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-white px-1 py-1.5 dark:bg-zinc-950">
            <dt className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</dt>
            <dd className="mt-0.5 text-xs font-medium tabular-nums text-zinc-800 dark:text-zinc-200">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function LeaderboardTable() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/leaderboard", { cache: "no-store" }).catch(() => null);
      const json = (await res?.json().catch(() => null)) as
        | { ok: true; rows: LeaderRow[] }
        | { ok: false; message: string }
        | null;

      if (!res || !json || !json.ok) {
        setRows([]);
        setLoading(false);
        return;
      }

      setRows(json.rows ?? []);
      setLoading(false);
    }

    void load();
    const onChange = () => void load();
    window.addEventListener("wc:predictions-changed", onChange);
    return () => window.removeEventListener("wc:predictions-changed", onChange);
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-white/10">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Leaderboard</h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {loading ? "Loading…" : `${rows.length} player${rows.length === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="p-3 sm:p-4">
        {loading ? (
          <div className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading leaderboard…</div>
        ) : rows.length === 0 ? (
          <div className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No scores yet. Make predictions and wait for results.
          </div>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {rows.map((r, i) => (
                <LeaderboardCard key={r.email} row={r} rank={i + 1} />
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[32rem] text-left text-xs">
                <thead className="text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="pb-2 pr-3 font-normal">#</th>
                    <th className="pb-2 pr-3 font-normal">Player</th>
                    <th className="pb-2 pr-3 font-normal">Pts</th>
                    <th className="pb-2 pr-3 font-normal">Pred</th>
                    <th className="pb-2 pr-3 font-normal">Hit</th>
                    <th className="pb-2 pr-3 font-normal">Miss</th>
                    <th className="pb-2 font-normal">Draw</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800 dark:divide-white/10 dark:text-zinc-200">
                  {rows.map((r, i) => (
                    <tr key={r.email} className="hover:bg-zinc-50/80 dark:hover:bg-white/5">
                      <td className="py-2.5 pr-3 tabular-nums text-zinc-500">{i + 1}</td>
                      <td className="max-w-[12rem] truncate py-2.5 pr-3" title={r.email}>
                        {r.email}
                      </td>
                      <td className="py-2.5 pr-3 font-medium tabular-nums">{r.points ?? 0}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{r.predicted ?? 0}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{r.correct}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{r.incorrect}</td>
                      <td className="py-2.5 tabular-nums">{r.draw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
