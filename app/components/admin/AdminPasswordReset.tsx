"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/app/components/AuthProvider";

const inputClassName =
  "form-control h-9 w-full min-w-0 rounded-lg px-3 text-sm tracking-normal shadow-sm";

export function AdminPasswordReset() {
  const { user, ready } = useAuth();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!ready || !user?.isAdmin) {
    return null;
  }

  const hasUsername = username.trim().length >= 3;
  const hasEmail = email.trim().includes("@");
  const canSubmit = (hasUsername || hasEmail) && newPassword.length >= 6;

  function closeModal() {
    setOpen(false);
    setError(null);
    setSuccess(null);
    setUsername("");
    setEmail("");
    setNewPassword("");
    setBusy(false);
  }

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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shadow-claros-button inline-flex h-9 items-center justify-center rounded-md border border-secondary-border bg-background px-4 text-sm font-medium text-primary-text transition-colors hover:border-primary-200 hover:bg-primary-50"
      >
        Reset user password
      </button>

      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-surface-blue-900/40 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) closeModal();
              }}
            >
              <div className="my-auto w-full max-w-md rounded-2xl border border-secondary-border bg-background shadow-xl">
                <div className="flex items-start justify-between gap-4 border-b border-secondary-border px-5 py-4">
                  <div className="min-w-0">
                    <div id={titleId} className="font-semibold text-sm text-primary-dark">
                      Reset user password
                    </div>
                    <div className="mt-1 text-xs text-secondary-text">
                      Look up a user by username or email and set a new password.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full px-3 py-1.5 text-xs text-secondary-text hover:bg-secondary-50"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4 p-5">
                  <p className="text-xs text-secondary-text">
                    Use a username or email — only one is required.
                  </p>

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
                    className="shadow-claros-button inline-flex h-9 w-full items-center justify-center rounded-md bg-primary-600 px-4 font-semibold text-sm text-primary-foreground transition-colors hover:bg-primary-700 disabled:opacity-50"
                  >
                    {busy ? "Resetting…" : "Reset password"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
