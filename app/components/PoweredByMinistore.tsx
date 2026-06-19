const MINISTORE_URL = "https://ministore.live";

export function PoweredByMinistore() {
  return (
    <div
      className="border-b border-primary-700 bg-primary-600"
      role="contentinfo"
      aria-label="Powered by ministore.live"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-2 px-4 py-2 sm:px-8 lg:px-10">
        <span className="text-[11px] font-medium uppercase tracking-wider text-primary-100 sm:text-xs">
          Powered by
        </span>
        <a
          href={MINISTORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-background px-2.5 py-0.5 text-xs font-bold text-primary-600 shadow-sm transition-colors hover:bg-primary-50 hover:text-primary-700 sm:px-3 sm:py-1 sm:text-sm"
        >
          ministore.live
        </a>
      </div>
    </div>
  );
}
