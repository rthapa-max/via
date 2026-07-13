"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FunAwardResult, FunAwards as FunAwardsData } from "@/lib/stats";

type AwardKey = keyof Omit<FunAwardsData, "facts">;

const AWARD_META: Record<
  AwardKey,
  { tag: string; description: string; tagClass: string }
> = {
  oracle: {
    tag: "The Oracle",
    description: "Best exact-score accuracy",
    tagClass: "bg-primary-dark text-white",
  },
  woodenSpoon: {
    tag: "Wooden Spoon",
    description: "Fewest points on the board",
    tagClass: "bg-yellow-300 text-brown-500",
  },
  fenceSitter: {
    tag: "Fence Sitter",
    description: "Can't resist calling a draw",
    tagClass: "bg-surface-blue-100 text-surface-blue-700",
  },
  soClose: {
    tag: "So Close!",
    description: "Right winner, wrong score — the most",
    tagClass: "bg-primary-100 text-primary-700",
  },
  chaosAgent: {
    tag: "Chaos Agent",
    description: "Called the wrong winner most often",
    tagClass: "bg-primary-dark text-white",
  },
  completionist: {
    tag: "The Completionist",
    description: "Most predictions submitted",
    tagClass: "bg-yellow-300 text-brown-500",
  },
  goalRush: {
    tag: "Goal Rush",
    description: "Predicts the highest-scoring matches",
    tagClass: "bg-surface-blue-100 text-surface-blue-700",
  },
  lockdownDefender: {
    tag: "Lockdown Defender",
    description: "Predicts the tightest, lowest-scoring matches",
    tagClass: "bg-primary-600 text-white",
  },
};

const AWARD_ORDER: AwardKey[] = [
  "oracle",
  "woodenSpoon",
  "fenceSitter",
  "soClose",
  "chaosAgent",
  "completionist",
  "goalRush",
  "lockdownDefender",
];

function AwardCard({ awardKey, result }: { awardKey: AwardKey; result: FunAwardResult }) {
  const meta = AWARD_META[awardKey];
  return (
    <div className="w-60 shrink-0 snap-start rounded-lg border border-secondary-border bg-background p-3 sm:w-auto sm:shrink sm:p-4">
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.tagClass}`}
      >
        {meta.tag}
      </span>
      <p className="mt-2 text-xs text-secondary-text">{meta.description}</p>
      {result ? (
        <>
          <p className="mt-2 truncate font-semibold text-primary-dark">{result.name}</p>
          <p className="mt-0.5 text-[11px] text-secondary-text">{result.display}</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-secondary-text">Not enough picks yet</p>
      )}
    </div>
  );
}

export function FunAwards({ data: providedData, viewAllHref }: { data?: FunAwardsData; viewAllHref?: string }) {
  const [fetchedData, setFetchedData] = useState<FunAwardsData | null>(null);
  const [loading, setLoading] = useState(!providedData);

  useEffect(() => {
    if (providedData) return;
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/stats", { cache: "no-store" }).catch(() => null);
      const json = (await res?.json().catch(() => null)) as
        | { ok: true; fun: FunAwardsData }
        | { ok: false }
        | null;

      if (cancelled) return;
      if (!res || !json || !json.ok) {
        setFetchedData(null);
        setLoading(false);
        return;
      }

      setFetchedData(json.fun);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [providedData]);

  const data = providedData ?? fetchedData;

  return (
    <section className="rounded-xl border border-secondary-border bg-background p-4 shadow-sm sm:p-5">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-base text-primary-dark sm:text-lg">🏆 Fun Awards</h2>
          <p className="mt-0.5 text-xs text-secondary-text sm:text-sm">
            Who&apos;s crushing it, who&apos;s not, and everything in between.
          </p>
        </div>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-primary-600 px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-700 sm:h-9 sm:px-4 sm:text-sm"
          >
            View all stats
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-4 py-6 text-center text-sm text-secondary-text">Loading awards…</div>
      ) : !data ? (
        <div className="mt-4 py-6 text-center text-sm text-secondary-text">
          Awards aren&apos;t available right now.
        </div>
      ) : (
        <>
          <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
            {AWARD_ORDER.map((key) => (
              <AwardCard key={key} awardKey={key} result={data[key]} />
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-secondary-border bg-secondary-25 p-3 sm:p-4">
            <p className="text-xs font-semibold text-primary-dark sm:text-sm">Fun facts from the league</p>
            <ul className="mt-1.5 space-y-1 text-xs text-secondary-text sm:text-sm">
              <li>On average, players predict {data.facts.avgPredictedGoalsPerMatch.toFixed(1)} goals per match.</li>
              <li>{Math.round(data.facts.drawPredictionRate * 100)}% of all predictions submitted have been draws.</li>
              {data.facts.mostPopularScoreline ? (
                <li>
                  {data.facts.mostPopularScoreline.scoreline} is the most popular scoreline pick — called{" "}
                  {data.facts.mostPopularScoreline.count} times across the league.
                </li>
              ) : null}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
