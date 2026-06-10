"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AppUser = {
  id: string;
  email: string | null;
  username?: string | null;
  isAdmin?: boolean;
  favoriteTeam?: string | null;
};

type AuthContextValue = {
  user: AppUser | null;
  ready: boolean;
  login(
    username: string,
    email: string,
    password: string,
  ): Promise<{ ok: true } | { ok: false; message: string }>;
  signOut(): Promise<void>;
  setFavoriteTeam(team: string): Promise<{ ok: true } | { ok: false; message: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      const json = (await res?.json().catch(() => null)) as { user: AppUser | null } | null;
      setUser(json?.user ?? null);
      setReady(true);
    }

    void init();
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      ready,
      async login(username, email, password) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        }).catch(() => null);

        const json = (await res?.json().catch(() => null)) as
          | { ok: true; user: AppUser }
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
      async setFavoriteTeam(team) {
        const res = await fetch("/api/user/favorite-team", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ team }),
        }).catch(() => null);

        const json = (await res?.json().catch(() => null)) as
          | { ok: true; favoriteTeam: string }
          | { ok: false; message: string }
          | null;

        if (!res || !json || !json.ok) {
          return { ok: false, message: json && "message" in json ? json.message : "Failed to save." };
        }

        setUser((prev) => (prev ? { ...prev, favoriteTeam: json.favoriteTeam } : prev));
        return { ok: true };
      },
    }),
    [ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

