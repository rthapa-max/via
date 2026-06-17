type PoweredByMinistoreProps = {
  variant?: "footer" | "banner";
};

const MINISTORE_URL = "https://ministore.live";

export function PoweredByMinistore({ variant = "footer" }: PoweredByMinistoreProps) {
  if (variant === "banner") {
    return (
      <div
        className="rounded-lg border border-primary-200 bg-gradient-to-r from-primary-50 via-background to-primary-50 px-4 py-3 text-center shadow-sm"
        role="contentinfo"
      >
        <p className="text-sm text-primary-text">
          <span className="text-secondary-text">Powered by</span>{" "}
          <a
            href={MINISTORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary-600 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-700"
          >
            ministore.live
          </a>
        </p>
      </div>
    );
  }

  return (
    <footer
      className="mt-auto border-t border-primary-200 bg-primary-600"
      role="contentinfo"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-2 px-4 py-3 sm:px-8 lg:px-10">
        <span className="text-xs font-medium uppercase tracking-wider text-primary-100 sm:text-sm">
          Powered by
        </span>
        <a
          href={MINISTORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-background px-3 py-1 text-sm font-bold text-primary-600 shadow-sm transition-colors hover:bg-primary-50 hover:text-primary-700"
        >
          ministore.live
        </a>
      </div>
    </footer>
  );
}
