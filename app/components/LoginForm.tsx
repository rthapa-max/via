"use client";

import { useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";

const inputClassName =
  "form-control h-11 w-full min-w-0 rounded-lg px-3.5 text-sm tracking-normal shadow-sm";

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    onSuccess?.();
  }

  return (
    <div className="grid gap-4">
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-secondary-text">Email</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          inputMode="email"
          type="email"
          autoComplete="email"
          className={inputClassName}
          placeholder="you@example.com"
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-secondary-text">Password</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          className={inputClassName}
          placeholder="••••••••"
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
        />
      </label>

      {error ? (
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs text-danger-600">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy || !email.trim() || !password}
        className="shadow-claros-button mt-1 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary-600 px-4 font-semibold text-sm text-primary-foreground transition-colors hover:bg-primary-700 disabled:opacity-50"
      >
        {busy ? "Please wait…" : "Continue"}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-tertiary-400">
        New here? An account is created automatically.
      </p>
    </div>
  );
}
