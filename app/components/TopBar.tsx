"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import vianetLogo from "@/app/image.png";
import { FavoriteTeamPicker } from "@/app/components/FavoriteTeamPicker";
import { PoweredByMinistore } from "@/app/components/PoweredByMinistore";
import { PredictionHistoryButton } from "@/app/components/PredictionHistoryButton";
import { useAuth } from "@/app/components/AuthProvider";

export function TopBar() {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await signOut();
    setBusy(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-secondary-border bg-background shadow-sm">
      <div className="h-1 bg-primary-600" aria-hidden="true" />
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Image
            src={vianetLogo}
            alt="Vianet"
            width={140}
            height={36}
            className="h-7 w-auto max-w-[7rem] shrink-0 object-contain object-left sm:h-8 sm:max-w-[8rem]"
            priority
          />
          <div className="min-w-0">
            <div className="truncate font-semibold text-sm tracking-tight text-primary-dark sm:text-base">
              <span className="text-primary-600">Vianet</span> WC26 Prediction
            </div>
            {user ? (
              <div className="truncate text-xs text-secondary-text">
                {user.username ? `@${user.username}` : (user.email ?? "Signed in")}
              </div>
            ) : null}
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <FavoriteTeamPicker />
          <PredictionHistoryButton />

          {user?.isAdmin ? (
            <Link
              href="/admin"
              className="hidden h-8 items-center justify-center rounded-md border border-secondary-border bg-background px-3 text-xs font-medium text-primary-text transition-colors hover:border-primary-200 hover:bg-primary-50 sm:inline-flex"
            >
              Admin
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => void logout()}
            disabled={busy}
            className="inline-flex h-8 items-center justify-center rounded-md bg-action px-3.5 text-xs font-semibold text-action-foreground transition-colors hover:brightness-95 disabled:opacity-60"
          >
            {busy ? "…" : "Logout"}
          </button>
        </div>
      </div>
      <PoweredByMinistore />
    </header>
  );
}
