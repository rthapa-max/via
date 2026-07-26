"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/app/components/AuthProvider";

const SCOPES = [
  { value: "overall", label: "Overall", description: "All points across the whole tournament." },
  { value: "knockout", label: "Knockout stage", description: "Round of 32 onward only." },
  { value: "group", label: "Group stage", description: "First stage matches only." },
] as const;

type Scope = (typeof SCOPES)[number]["value"];

function filenameFromDisposition(header: string | null) {
  if (!header) return "prediction-points.csv";
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1] ?? "prediction-points.csv";
}

export function AdminPointsExport() {
  const { user, ready } = useAuth();
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!ready || !user?.isAdmin) {
    return null;
  }

  async function download(scope: Scope) {
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/admin/points-export?scope=${scope}`, { cache: "no-store" }).catch(
      () => null,
    );
    if (!res) {
      setError("Failed to download CSV.");
      setBusy(false);
      return;
    }

    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { message?: string } | null;
      setError(json?.message ?? "Failed to download CSV.");
      setBusy(false);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filenameFromDisposition(res.headers.get("content-disposition"));
    link.click();
    URL.revokeObjectURL(url);
    setBusy(false);
    setOpen(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="shadow-claros-button inline-flex h-9 items-center justify-center rounded-md border border-secondary-border bg-background px-4 text-sm font-medium text-primary-text transition-colors hover:border-primary-200 hover:bg-primary-50 disabled:opacity-50"
      >
        Export points CSV
      </button>
      {error && !open ? <p className="text-xs text-danger-600">{error}</p> : null}

      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-surface-blue-900/40 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget && !busy) setOpen(false);
              }}
            >
              <div className="my-auto w-full max-w-md rounded-2xl border border-secondary-border bg-background p-5 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div id={titleId} className="font-semibold text-sm">
                      Export points CSV
                    </div>
                    <div className="mt-1 text-xs text-secondary-text">
                      Choose which points to include in the export.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={busy}
                    className="rounded-full px-3 py-1.5 text-xs text-secondary-text hover:bg-secondary-50 disabled:opacity-50"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {SCOPES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => void download(option.value)}
                      disabled={busy}
                      className="rounded-md border border-secondary-border px-4 py-2 text-left text-sm transition-colors hover:border-primary-200 hover:bg-primary-50 disabled:opacity-50"
                    >
                      <div className="font-medium text-primary-text">{option.label}</div>
                      <div className="text-xs text-secondary-text">{option.description}</div>
                    </button>
                  ))}
                </div>

                {busy ? <p className="mt-3 text-xs text-secondary-text">Exporting…</p> : null}
                {error ? <p className="mt-3 text-xs text-danger-600">{error}</p> : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
