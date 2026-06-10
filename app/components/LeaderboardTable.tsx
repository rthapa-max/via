"use client";

import { useEffect, useState } from "react";
import { flagUrlForTeam } from "@/lib/fixtures";

type LeaderRow = {
  email: string;
  favorite_team?: string | null;
  points?: number;
};

function PlayerFlag({ team }: { team: string }) {
  const flagUrl = flagUrlForTeam(team, 40);
  if (!flagUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagUrl}
      alt=""
      width={18}
      height={14}
      className="h-3.5 w-[1.125rem] shrink-0 rounded-[2px] object-cover ring-1 ring-secondary-border"
    />
  );
}

function displayName(email: string) {
  return email.split("@")[0] ?? email;
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
    <section className="overflow-hidden rounded-2xl border border-secondary-border bg-background shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-secondary-border px-5 py-4 sm:px-6">
        <h2 className="font-semibold text-base text-primary-text">Leaderboard</h2>
        <span className="text-sm text-secondary-text">
          {loading ? "Loading…" : `${rows.length} player${rows.length === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="py-10 text-center text-sm text-secondary-text">Loading leaderboard…</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-secondary-text">
            No players yet. Sign in to appear on the leaderboard.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-striped table-borderless w-full text-left text-sm">
              <thead className="text-xs text-secondary-text">
                <tr>
                  <th className="pb-3 pl-4 pr-4 font-normal sm:pl-6">#</th>
                  <th className="pb-3 pr-4 font-normal">Player</th>
                  <th className="pb-3 pl-4 pr-4 text-right font-normal sm:pr-6">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-75 text-primary-text">
                {rows.map((row, index) => (
                  <tr key={row.email} className="hover:bg-secondary-50">
                    <td className="py-3.5 pl-4 pr-4 tabular-nums text-gray-400 sm:pl-6">{index + 1}</td>
                    <td className="max-w-[14rem] py-3.5 pr-4" title={row.email}>
                      <span className="inline-flex min-w-0 items-center gap-2.5">
                        <span className="truncate">{displayName(row.email)}</span>
                        {row.favorite_team ? <PlayerFlag team={row.favorite_team} /> : null}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 pr-4 text-right font-semibold tabular-nums text-primary-text sm:pr-6">
                      {row.points ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
