"use client";

import { useEffect, useState } from "react";
import { flagUrlForTeam } from "@/lib/fixtures";

type LeaderRow = {
  email: string;
  username?: string | null;
  favorite_team?: string | null;
  points?: number;
};

type TabId = "knockout" | "group" | "overall";

const TABS: { id: TabId; label: string; query: string; emptyMessage: string }[] = [
  {
    id: "knockout",
    label: "Knockout",
    query: "/api/leaderboard",
    emptyMessage: "No players yet. Sign in to appear on the leaderboard.",
  },
  {
    id: "group",
    label: "Group stage",
    query: "/api/leaderboard?stage=group",
    emptyMessage: "No group-stage points yet.",
  },
  {
    id: "overall",
    label: "Overall",
    query: "/api/leaderboard?stage=all",
    emptyMessage: "No points yet.",
  },
];

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

function displayName(row: LeaderRow) {
  if (row.username) return row.username;
  if (row.email) return row.email.split("@")[0] ?? row.email;
  return "Player";
}

function LeaderCrown() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <path
        d="M2.5 12.5h11M3.5 12.5 4.5 5.5l3 2.5 1.5-3.5 1.5 3.5 3-2.5 1 7"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LeaderboardTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("knockout");
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const res = await fetch(tab.query, { cache: "no-store" }).catch(() => null);
      const json = (await res?.json().catch(() => null)) as
        | { ok: true; rows: LeaderRow[] }
        | { ok: false; message: string }
        | null;

      if (cancelled) return;

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
    return () => {
      cancelled = true;
      window.removeEventListener("wc:predictions-changed", onChange);
    };
  }, [tab.query]);

  return (
    <section className="overflow-hidden rounded-xl border border-secondary-border bg-background shadow-sm">
      <div className="border-b border-secondary-border bg-primary-600 px-5 pt-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-base text-primary-foreground">Leaderboard</h2>
          <span className="text-sm text-primary-100">
            {loading ? "Loading…" : `${rows.length} player${rows.length === 1 ? "" : "s"}`}
          </span>
        </div>

        <div className="mt-3 flex gap-1" role="tablist" aria-label="Leaderboard view">
          {TABS.map((t) => {
            const isActive = t.id === activeTab;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(t.id)}
                className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-background text-primary-700"
                    : "bg-primary-500/40 text-primary-50 hover:bg-primary-500/60"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="py-10 text-center text-sm text-secondary-text">Loading leaderboard…</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-secondary-text">{tab.emptyMessage}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-borderless w-full text-left text-sm">
              <thead className="text-xs text-secondary-text">
                <tr>
                  <th className="pb-3 pl-4 pr-4 font-normal sm:pl-6">#</th>
                  <th className="pb-3 pr-4 font-normal">Player</th>
                  <th className="pb-3 pl-4 pr-4 text-right font-normal sm:pr-6">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-75 text-primary-text">
                {rows.map((row, index) => {
                  const isLeader = index === 0;
                  return (
                    <tr
                      key={row.email}
                      className={
                        isLeader
                          ? "bg-gradient-to-r from-primary-50 via-primary-100/60 to-yellow-300/40"
                          : "hover:bg-secondary-50"
                      }
                    >
                      <td className="py-3.5 pl-4 pr-4 sm:pl-6">
                        {isLeader ? (
                          <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-primary-600">
                            <LeaderCrown />
                            1
                          </span>
                        ) : (
                          <span className="tabular-nums text-gray-400">{index + 1}</span>
                        )}
                      </td>
                      <td className="max-w-[14rem] py-3.5 pr-4" title={row.email}>
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <span
                            className={`truncate ${isLeader ? "font-semibold text-primary-dark" : ""}`}
                          >
                            {displayName(row)}
                          </span>
                          {isLeader ? (
                            <span className="shrink-0 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                              Leader
                            </span>
                          ) : null}
                          {row.favorite_team ? <PlayerFlag team={row.favorite_team} /> : null}
                        </span>
                      </td>
                      <td
                        className={`py-3.5 pl-4 pr-4 text-right tabular-nums sm:pr-6 ${
                          isLeader
                            ? "font-semibold text-primary-700"
                            : "font-semibold text-primary-text"
                        }`}
                      >
                        {row.points ?? 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
