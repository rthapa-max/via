"use client";

import { useEffect, useState } from "react";

type PrizeRow = { position: string; amount: number };
type LeaderRow = { id?: string; email: string; username?: string | null; points?: number };
type Tier = { points: number; players: LeaderRow[] };

const GROUP_STAGE_PRIZES: PrizeRow[] = [
  { position: "1st Prize", amount: 5000 },
  { position: "2nd Prize", amount: 3000 },
  { position: "3rd Prize", amount: 2000 },
];

const KNOCKOUT_STAGE_PRIZES: PrizeRow[] = [
  { position: "1st Prize", amount: 7000 },
  { position: "2nd Prize", amount: 4000 },
  { position: "3rd Prize", amount: 2000 },
];

const OVERALL_PRIZES: PrizeRow[] = [
  { position: "1st Prize", amount: 12000 },
  { position: "2nd Prize", amount: 7000 },
  { position: "3rd Prize", amount: 4000 },
  { position: "4th Prize", amount: 2500 },
  { position: "5th Prize", amount: 1500 },
];

const STAGE_QUERIES = {
  group: "/api/leaderboard?stage=group",
  knockout: "/api/leaderboard?stage=knockout",
  overall: "/api/leaderboard?stage=all",
} as const;

function subtotal(rows: PrizeRow[]) {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString("en-US")}`;
}

const POSITION_DECOR = [
  {
    medal: "🥇",
    badgeClass: "bg-yellow-300 text-brown-500 ring-yellow-400",
    rowClass: "bg-gradient-to-r from-yellow-300/25 via-primary-100/40 to-primary-50 ring-1 ring-inset ring-yellow-400/50",
  },
  {
    medal: "🥈",
    badgeClass: "bg-gray-200 text-gray-700 ring-gray-300",
    rowClass: "bg-secondary-25",
  },
  {
    medal: "🥉",
    badgeClass: "bg-orange-50 text-orange-500 ring-orange-500/40",
    rowClass: "bg-secondary-25/60",
  },
] as const;

function displayName(row: LeaderRow) {
  if (row.username) return row.username;
  if (row.email) return row.email.split("@")[0] ?? row.email;
  return "Player";
}

async function fetchLeaderboard(query: string): Promise<LeaderRow[]> {
  const res = await fetch(query, { cache: "no-store" }).catch(() => null);
  const json = (await res?.json().catch(() => null)) as
    | { ok: true; rows: LeaderRow[] }
    | { ok: false }
    | null;
  if (!res || !json || !json.ok) return [];
  return json.rows ?? [];
}

function buildTiers(rows: LeaderRow[]): Tier[] {
  const tiers: Tier[] = [];
  for (const row of rows) {
    const points = row.points ?? 0;
    if (points <= 0) continue;
    const current = tiers[tiers.length - 1];
    if (current && current.points === points) {
      current.players.push(row);
    } else {
      tiers.push({ points, players: [row] });
    }
  }
  return tiers;
}

function PrizeTable({
  title,
  rows,
  tiers,
  loading,
}: {
  title: string;
  rows: PrizeRow[];
  tiers: Tier[];
  loading: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-secondary-border bg-background">
      <div className="border-b border-secondary-border bg-secondary-25 px-3 py-2">
        <p className="font-semibold text-xs text-primary-dark sm:text-sm">{title}</p>
      </div>
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="text-secondary-text">
          <tr>
            <th className="px-3 py-2 font-normal">Position</th>
            <th className="px-3 py-2 font-normal">Winner</th>
            <th className="px-3 py-2 text-right font-normal">Prize Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-75">
          {rows.map((row, index) => {
            const tier = tiers[index];
            const winners = tier?.players ?? [];
            const hasWinner = winners.length > 0;
            const decor = hasWinner ? POSITION_DECOR[index] : undefined;
            return (
              <tr key={row.position} className={decor?.rowClass}>
                <td className="px-3 py-2 align-top text-primary-text">
                  {decor ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ring-1 ${decor.badgeClass}`}
                    >
                      <span aria-hidden="true">{decor.medal}</span>
                      {row.position}
                    </span>
                  ) : (
                    row.position
                  )}
                </td>
                <td className="px-3 py-2 align-top text-primary-text">
                  {loading ? (
                    <span className="text-secondary-text">Loading…</span>
                  ) : winners.length === 0 ? (
                    <span className="text-secondary-text">Not decided yet</span>
                  ) : (
                    <div className="space-y-0.5">
                      {winners.map((winner) => (
                        <div key={winner.id ?? winner.email} className="flex items-center gap-1.5 truncate font-medium">
                          <span className="truncate">{displayName(winner)}</span>
                          {index === 0 ? (
                            <span className="shrink-0 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                              🎉 Champion
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-right align-top tabular-nums text-primary-text">
                  {formatAmount(row.amount)}
                  {winners.length > 1 ? (
                    <span className="block text-[10px] font-normal text-secondary-text">
                      split {winners.length} ways
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-secondary-border bg-secondary-25 font-semibold">
            <td className="px-3 py-2 text-primary-dark" colSpan={2}>
              Subtotal
            </td>
            <td className="px-3 py-2 text-right tabular-nums text-primary-dark">
              {formatAmount(subtotal(rows))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function PrizePool() {
  const [loading, setLoading] = useState(true);
  const [groupRows, setGroupRows] = useState<LeaderRow[]>([]);
  const [knockoutRows, setKnockoutRows] = useState<LeaderRow[]>([]);
  const [overallRows, setOverallRows] = useState<LeaderRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [group, knockout, overall] = await Promise.all([
        fetchLeaderboard(STAGE_QUERIES.group),
        fetchLeaderboard(STAGE_QUERIES.knockout),
        fetchLeaderboard(STAGE_QUERIES.overall),
      ]);
      if (cancelled) return;
      setGroupRows(group);
      setKnockoutRows(knockout);
      setOverallRows(overall);
      setLoading(false);
    }

    void load();
    const onChange = () => void load();
    window.addEventListener("wc:predictions-changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("wc:predictions-changed", onChange);
    };
  }, []);

  const groupTiers = buildTiers(groupRows);
  const knockoutTiers = buildTiers(knockoutRows);
  const overallTiers = buildTiers(overallRows);

  return (
    <section className="rounded-xl border border-secondary-border bg-background p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-semibold text-base text-primary-dark sm:text-lg">🏆 Prize Pool</h2>
        <p className="mt-0.5 text-xs text-secondary-text sm:text-sm">
          Cash prizes across the group stage, knockout stage, and overall tournament standings, based on current
          points.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PrizeTable title="Group Stage Winners" rows={GROUP_STAGE_PRIZES} tiers={groupTiers} loading={loading} />
        <PrizeTable
          title="Knockout Stage Winners"
          rows={KNOCKOUT_STAGE_PRIZES}
          tiers={knockoutTiers}
          loading={loading}
        />
        <PrizeTable title="Overall Tournament Winners" rows={OVERALL_PRIZES} tiers={overallTiers} loading={loading} />
      </div>

      <p className="mt-4 rounded-lg border border-secondary-border bg-secondary-25 p-3 text-xs text-secondary-text sm:text-sm">
        <span className="font-semibold text-primary-dark">Note: </span>
        If there are multiple winners on the same position, the mentioned amount will be divided among the number of
        winners.
      </p>
    </section>
  );
}
