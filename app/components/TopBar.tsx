"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthModal } from "@/app/components/AuthModal";
import { PredictionHistoryButton } from "@/app/components/PredictionHistoryButton";
import { useAuth } from "@/app/components/AuthProvider";

export function TopBar() {
  const { user, ready, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  async function logout() {
    setBusy(true);
    await signOut();
    setBusy(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/90">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="min-w-0">
          <div className="text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
            WC 2026 Predictions
          </div>
          {user ? (
            <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</div>
          ) : (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Pick scores. Climb the board.</div>
          )}
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <PredictionHistoryButton />

          {/* {user?.isAdmin ? (
            <Link
              href="/admin"
              className="hidden h-8 items-center justify-center rounded-full border border-zinc-200 bg-white px-3 text-xs text-zinc-700 transition-colors hover:bg-zinc-50 sm:inline-flex dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/5"
            >
              Admin
            </Link>
          ) : null} */}

          {user ? (
            <button
              type="button"
              onClick={() => void logout()}
              disabled={busy}
              className="inline-flex h-8 items-center justify-center rounded-full border border-zinc-200 bg-white px-3.5 text-xs text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/5"
            >
              {busy ? "…" : "Logout"}
            </button>
          ) : ready ? (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="inline-flex h-8 items-center justify-center rounded-full bg-zinc-900 px-3.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Login
            </button>
          ) : null}
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}
