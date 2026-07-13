"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { StatTile } from "@/app/components/StatTile";
import { FunAwards } from "@/app/components/FunAwards";
import { flagUrlForTeam } from "@/lib/fixtures";
import type { StatsPayload } from "@/lib/stats";

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
      className="h-3.5 w-4.5 shrink-0 rounded-[2px] object-cover ring-1 ring-secondary-border"
    />
  );
}

export function StatsFull() {
  const { user } = useAuth();
  const [data, setData] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/stats", { cache: "no-store" }).catch(() => null);
      const json = (await res?.json().catch(() => null)) as ({ ok: true } & StatsPayload) | { ok: false } | null;

      if (cancelled) return;
      if (!res || !json || !json.ok) {
        setError(true);
        setLoading(false);
        return;
      }

      setData(json);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="py-16 text-center text-sm text-secondary-text">Loading stats…</div>;
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center text-sm text-secondary-text">
        Stats aren&apos;t available right now.
      </div>
    );
  }

  const { totals, players, you, fun } = data;

  return (
    <div className="space-y-8 sm:space-y-10">
      <section>
        <h2 className="font-semibold text-base text-primary-dark sm:text-lg">Your stats</h2>
        <p className="mt-0.5 text-xs text-secondary-text sm:text-sm">
          {you ? `Rank ${you.rank} of ${you.totalPlayers}` : "See how your predictions stack up."}
        </p>

        {you ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              <StatTile label="Points" value={you.points} />
              <StatTile label="Predictions" value={you.predictions} />
              <StatTile label="Correct" value={you.correct} sublabel="exact score" />
              <StatTile label="Wrong" value={you.wrong} sublabel="wrong winner" />
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              <StatTile label="Draws picked" value={you.draws} />
              <StatTile label="Exact rate" value={`${Math.round(you.exactRate * 100)}%`} />
              <StatTile label="Correct or better" value={`${Math.round(you.correctOrBetterRate * 100)}%`} />
              <StatTile label="Rank" value={`${you.rank}/${you.totalPlayers}`} />
            </div>
          </>
        ) : (
          <div className="mt-3 rounded-lg border border-secondary-border p-4 text-sm text-secondary-text">
            Make your first prediction to see your personal stats here.
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-base text-primary-dark sm:text-lg">Tournament totals</h2>
        <p className="mt-0.5 text-xs text-secondary-text sm:text-sm">Added up across every player.</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          <StatTile label="Players" value={totals.players} />
          <StatTile label="Predictions" value={totals.predictions} />
          <StatTile label="Correct" value={totals.correct} />
          <StatTile label="Wrong" value={totals.wrong} />
          <StatTile label="Draws picked" value={totals.draws} />
          <StatTile label="Points" value={totals.points} />
        </div>
      </section>

      <FunAwards data={fun} />

      <section>
        <h2 className="font-semibold text-base text-primary-dark sm:text-lg">All players</h2>
        <p className="mt-0.5 text-xs text-secondary-text sm:text-sm">Your row is highlighted.</p>

        <div className="mt-3 overflow-hidden rounded-xl border border-secondary-border">
          <div className="overflow-x-auto">
            <table className="table-borderless w-full text-left text-sm">
              <thead className="bg-secondary-25 text-xs text-secondary-text">
                <tr>
                  <th className="py-3 pl-4 pr-3 font-normal sm:pl-6">#</th>
                  <th className="py-3 pr-3 font-normal">Player</th>
                  <th className="py-3 pr-3 text-right font-normal">Points</th>
                  <th className="py-3 pr-3 text-right font-normal">Predictions</th>
                  <th className="py-3 pr-3 text-right font-normal">Correct</th>
                  <th className="py-3 pr-3 text-right font-normal">Wrong</th>
                  <th className="py-3 pr-4 text-right font-normal sm:pr-6">Draws</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-75 text-primary-text">
                {players.map((player, index) => {
                  const isYou = user?.id === player.id;
                  return (
                    <tr key={player.id} className={isYou ? "bg-primary-50 ring-1 ring-inset ring-primary-200" : "hover:bg-secondary-50"}>
                      <td className="py-3 pl-4 pr-3 tabular-nums text-gray-400 sm:pl-6">{index + 1}</td>
                      <td className="max-w-48 py-3 pr-3">
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <span className={`truncate ${isYou ? "font-semibold text-primary-dark" : ""}`}>
                            {player.name}
                          </span>
                          {isYou ? (
                            <span className="shrink-0 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                              You
                            </span>
                          ) : null}
                          {player.favoriteTeam ? <PlayerFlag team={player.favoriteTeam} /> : null}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right font-semibold tabular-nums text-primary-text">
                        {player.points}
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums">{player.predictions}</td>
                      <td className="py-3 pr-3 text-right tabular-nums">{player.correct}</td>
                      <td className="py-3 pr-3 text-right tabular-nums">{player.wrong}</td>
                      <td className="py-3 pr-4 text-right tabular-nums sm:pr-6">{player.draws}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
