"use client";

import { useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";

function filenameFromDisposition(header: string | null) {
  if (!header) return "prediction-points.csv";
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1] ?? "prediction-points.csv";
}

export function AdminPointsExport() {
  const { user, ready } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready || !user?.isAdmin) {
    return null;
  }

  async function download() {
    setBusy(true);
    setError(null);

    const res = await fetch("/api/admin/points-export", { cache: "no-store" }).catch(() => null);
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
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void download()}
        disabled={busy}
        className="shadow-claros-button inline-flex h-9 items-center justify-center rounded-md border border-secondary-border bg-background px-4 text-sm font-medium text-primary-text transition-colors hover:border-primary-200 hover:bg-primary-50 disabled:opacity-50"
      >
        {busy ? "Exporting…" : "Export points CSV"}
      </button>
      {error ? <p className="text-xs text-danger-600">{error}</p> : null}
    </div>
  );
}
