const RULES = [
  {
    points: 3,
    label: "Exact score",
    detail: "Matches the final result.",
    tone: "primary" as const,
  },
  {
    points: 2,
    label: "Correct winner",
    detail: "Right winner, wrong goals.",
    tone: "yellow" as const,
  },
  {
    points: 1,
    label: "Wrong outcome",
    detail: "Still earns 1 pt.",
    tone: "surface" as const,
  },
  {
    points: 0,
    label: "No prediction",
    detail: "Earns 0 pts.",
    tone: "muted" as const,
  },
] as const;

const badgeClass = {
  primary: "bg-primary-100 text-primary-700 ring-primary-200",
  yellow: "bg-yellow-300 text-brown-500 ring-yellow-400",
  surface: "bg-surface-blue-300 text-primary-700 ring-surface-blue-200",
  muted: "bg-secondary-100 text-tertiary-600 ring-secondary-200",
};

export function ScoringGuide() {
  return (
    <section
      className="rounded-lg border border-secondary-border bg-surface-blue-50 px-3 py-2 sm:px-4 sm:py-2.5"
      aria-label="How points work"
    >
      <p className="font-semibold text-xs text-primary-dark sm:text-sm">How points work</p>

      <ul className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4 sm:gap-x-5">
        {RULES.map((rule) => (
          <li key={rule.label} className="min-w-0">
            <div className="flex items-center gap-1 text-xs">
              <span
                className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 font-semibold text-[10px] tabular-nums ring-1 ${badgeClass[rule.tone]}`}
              >
                {rule.points}
              </span>
              <span className="font-medium text-primary-text">{rule.label}</span>
            </div>
            <p className="mt-0.5 pl-6 text-[11px] leading-snug text-secondary-text">
              {rule.detail}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
