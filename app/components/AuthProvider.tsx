"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthContextValue = {
  user: { id: string; email: string; isAdmin?: boolean } | null;
  ready: boolean;
  login(email: string, password: string): Promise<{ ok: true } | { ok: false; message: string }>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; isAdmin?: boolean } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      const json = (await res?.json().catch(() => null)) as {
        user: { id: string; email: string; isAdmin?: boolean } | null;
      } | null;
      setUser(json?.user ?? null);
      setReady(true);
    }

    void init();
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      ready,
      async login(email, password) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        }).catch(() => null);

        const json = (await res?.json().catch(() => null)) as
          | { ok: true; user: { id: string; email: string; isAdmin?: boolean } }
          | { ok: false; message: string }
          | null;

        if (!res || !json) return { ok: false, message: "Network error." };
        if (!json.ok) return { ok: false, message: json.message };

        setUser(json.user);
        return { ok: true };
      },
      async signOut() {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        setUser(null);
      },
    }),
    [ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

