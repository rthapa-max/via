export function StatTile({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-secondary-border bg-background px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="truncate text-[11px] font-medium uppercase tracking-wide text-secondary-text sm:text-xs">
        {label}
      </p>
      <p className="mt-1 truncate text-lg font-semibold tabular-nums text-primary-dark sm:text-xl">
        {value}
      </p>
      {sublabel ? (
        <p className="mt-0.5 truncate text-[11px] text-secondary-text">{sublabel}</p>
      ) : null}
    </div>
  );
}
