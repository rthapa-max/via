"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { LoginForm } from "@/app/components/LoginForm";

export function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-surface-blue-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="my-auto w-full max-w-md rounded-2xl border border-secondary-border bg-background p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div id={titleId} className="font-semibold text-sm">
              Sign in
            </div>
            <div className="mt-1 text-xs text-secondary-text">
              Enter a username or email and password to continue.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-xs text-secondary-text hover:bg-secondary-50"
          >
            Close
          </button>
        </div>

        <div className="mt-4">
          <LoginForm onSuccess={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
