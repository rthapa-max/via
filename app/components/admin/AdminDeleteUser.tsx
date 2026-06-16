"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/app/components/AuthProvider";

const inputClassName =
  "form-control h-9 w-full min-w-0 rounded-lg px-3 text-sm tracking-normal shadow-sm";

export function AdminDeleteUser() {
  const { user, ready } = useAuth();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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
  const canSubmit = hasUsername || hasEmail;

  function closeModal() {
    setOpen(false);
    setError(null);
    setSuccess(null);
    setUsername("");
    setEmail("");
    setBusy(false);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: username.trim(),
        email: email.trim(),
      }),
    }).catch(() => null);

    const json = (await res?.json().catch(() => null)) as
      | { ok: true; user: { username: string | null; email: string | null } }
      | { ok: false; message: string }
      | null;

    if (!res || !json || !json.ok) {
      setError(json && "message" in json ? json.message : "Failed to delete user.");
      setBusy(false);
      return;
    }

    const label = json.user.username
      ? `@${json.user.username}`
      : (json.user.email ?? "User");
    setSuccess(`Deleted ${label}.`);
    setUsername("");
    setEmail("");
    setBusy(false);
    window.dispatchEvent(new Event("wc:predictions-changed"));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center justify-center rounded-md border border-danger-200 bg-danger-50 px-4 text-sm font-medium text-danger-600 transition-colors hover:border-danger-500 hover:bg-danger-200/60"
      >
        Delete user
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
                      Delete user
                    </div>
                    <div className="mt-1 text-xs text-secondary-text">
                      Permanently remove a user from the database by username or email.
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
                  <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs text-danger-600">
                    This cannot be undone. The user and their predictions will be permanently
                    deleted.
                  </div>

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
                    className="inline-flex h-9 w-full items-center justify-center rounded-md bg-danger-600 px-4 font-semibold text-sm text-primary-foreground transition-colors hover:bg-danger-500 disabled:opacity-50"
                  >
                    {busy ? "Deleting…" : "Delete user"}
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
