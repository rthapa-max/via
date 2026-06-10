"use client";

import { useAuth } from "@/app/components/AuthProvider";
import { LoginScreen } from "@/app/components/LoginScreen";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-surface-blue-50 text-sm text-secondary-text">
        <div className="pointer-events-none absolute inset-0 bg-gradient-primary" aria-hidden="true" />
        <span className="relative">Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
