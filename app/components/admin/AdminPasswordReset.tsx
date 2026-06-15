"use client";

import { useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";

const inputClassName =
  "form-control h-9 w-full min-w-0 rounded-lg px-3 text-sm tracking-normal shadow-sm";

export function AdminPasswordReset() {
  const { user, ready } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!ready) {
    return <div className="text-sm text-secondary-text">Loading…</div>;
  }
  if (!user?.isAdmin) {
    return null;
  }

  const hasUsername = username.trim().length >= 3;
  const hasEmail = email.trim().includes("@");
  const canSubmit = (hasUsername || hasEmail) && newPassword.length >= 6;

  async function submit() {
    setBusy(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: username.trim(),
        email: email.trim(),
        newPassword,
      }),
    }).catch(() => null);

    const json = (await res?.json().catch(() => null)) as
      | { ok: true; user: { username: string | null; email: string | null } }
      | { ok: false; message: string }
      | null;

    if (!res || !json || !json.ok) {
      setError(json && "message" in json ? json.message : "Failed to reset password.");
      setBusy(false);
      return;
    }

    const label = json.user.username
      ? `@${json.user.username}`
      : (json.user.email ?? "User");
    setSuccess(`Password reset for ${label}.`);
    setUsername("");
    setEmail("");
    setNewPassword("");
    setBusy(false);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-secondary-border bg-background shadow-sm">
      <div className="border-b border-secondary-border bg-primary-600 px-5 py-4 sm:px-6">
        <h2 className="font-semibold text-base text-primary-foreground">Reset user password</h2>
        <p className="mt-1 text-sm text-primary-100">
          Look up a user by username or email and set a new password.
        </p>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <p className="text-xs text-secondary-text">
          Use a username or email — only one is required.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-secondary-text">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              autoComplete="off"
              className={inputClassName}
              placeholder="theirname"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-secondary-text">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              type="email"
              autoComplete="off"
              className={inputClassName}
              placeholder="user@example.com"
            />
          </label>
        </div>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-secondary-text">New password</span>
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            className={inputClassName}
            placeholder="At least 6 characters"
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSubmit && !busy) void submit();
            }}
          />
        </label>

        {error ? (
          <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs text-danger-600">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700">
            {success}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || !canSubmit}
          className="shadow-claros-button inline-flex h-9 items-center justify-center rounded-md bg-primary-600 px-4 font-semibold text-sm text-primary-foreground transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {busy ? "Resetting…" : "Reset password"}
        </button>
      </div>
    </section>
  );
}
