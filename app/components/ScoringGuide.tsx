"use client";

import { useState } from "react";

const RULES = [
  {
    points: 3,
    label: "Exact score",
    detail: "Predicted score matches the final score. e.g. pick 3-2 and result is 3-2, or pick 2-2 and result is 2-2.",
    tone: "emerald" as const,
  },
  {
    points: 1,
    label: "Correct winner, wrong score",
    detail: "Right outcome but wrong goals. e.g. pick 3-2 and result is 2-1.",
    tone: "amber" as const,
  },
  {
    points: 0,
    label: "Wrong outcome",
    detail: "Wrong winner or wrong result in every other case.",
    tone: "zinc" as const,
  },
] as const;

const toneClass = {
  emerald:
    "bg-emerald-50 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-500/30",
  amber:
    "bg-amber-50 text-amber-900 ring-amber-200/80 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-500/30",
  zinc: "bg-zinc-100 text-zinc-700 ring-zinc-200/80 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10",
};

export function ScoringGuide() {
  const [open, setOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm lg:sticky lg:top-20 dark:border-white/10 dark:bg-zinc-950">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left lg:pointer-events-none lg:cursor-default"
        aria-expanded={open}
      >
        <div>
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">How points work</h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">3 pts exact score · 1 pt correct winner</p>
        </div>
        <span className="shrink-0 text-xs text-zinc-500 lg:hidden">{open ? "Hide" : "Show"}</span>
      </button>

      <div className={`border-t border-zinc-200 px-4 py-3 dark:border-white/10 ${open ? "block" : "hidden lg:block"}`}>
        <ul className="space-y-2">
          {RULES.map((rule) => (
            <li
              key={rule.label}
              className="flex items-start gap-2.5 rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-white/5"
            >
              <span
                className={`inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums ring-1 ${toneClass[rule.tone]}`}
              >
                {rule.points}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-900 dark:text-zinc-50">{rule.label}</div>
                <div className="mt-0.5 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {rule.detail}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {/* <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
          Points apply after a match is marked finished in admin.
        </p> */}
      </div>
    </section>
  );
}
