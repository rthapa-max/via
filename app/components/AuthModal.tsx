"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/app/components/AuthProvider";

export function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
  }, [open]);

  async function submit() {
    setBusy(true);
    setError(null);

    const trimmedEmail = email.trim();
    const res = await login(trimmedEmail, password);
    if (!res.ok) {
      setBusy(false);
      setError(res.message);
      return;
    }
    setBusy(false);
    onClose();
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="my-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div id={titleId} className="text-sm font-medium">
              Sign in
            </div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Enter email and password to continue.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              type="email"
              autoComplete="email"
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/20"
              placeholder="you@example.com"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/20"
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-500/20 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !email.trim() || !password}
            className="mt-1 inline-flex h-9 items-center justify-center rounded-full bg-zinc-950 px-4 text-xs font-normal text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {busy ? "Please wait…" : "Continue"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

