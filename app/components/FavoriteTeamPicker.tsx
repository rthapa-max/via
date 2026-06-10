"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/app/components/AuthProvider";
import { flagUrlForTeam } from "@/lib/fixtures";

function TeamFlag({ team, size = 16 }: { team: string; size?: number }) {
  const flagUrl = flagUrlForTeam(team, 40);
  if (!flagUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagUrl}
      alt=""
      width={size}
      height={Math.round(size * 0.75)}
      className="shrink-0 rounded-[2px] object-cover ring-1 ring-black/10 dark:ring-white/10"
      style={{ width: size, height: Math.round(size * 0.75) }}
    />
  );
}

function TeamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 4h6v16H4V4Zm10 0h6v16h-6V4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FavoriteTeamPicker() {
  const titleId = useId();
  const { user, ready, setFavoriteTeam } = useAuth();
  const [teams, setTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, right: 0 });
  const [search, setSearch] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const favorite = user?.favoriteTeam ?? "";

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((team) => team.toLowerCase().includes(q));
  }, [search, teams]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadTeams() {
      setLoading(true);
      const res = await fetch("/api/teams", { cache: "no-store" }).catch(() => null);
      const json = (await res?.json().catch(() => null)) as
        | { ok: true; teams: string[] }
        | { ok: false; message: string }
        | null;

      if (!res || !json || !json.ok) {
        setTeams([]);
        setLoading(false);
        return;
      }

      setTeams(json.teams ?? []);
      setLoading(false);
    }

    void loadTeams();
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }

    const id = window.setTimeout(() => searchRef.current?.focus(), 0);

    function updatePosition() {
      const el = buttonRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPopoverPos({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  async function pickTeam(team: string) {
    if (!user || saving) return;
    setErr(null);
    setSaving(true);

    const res = await setFavoriteTeam(team);
    setSaving(false);

    if (!res.ok) {
      setErr(res.message);
      return;
    }

    setOpen(false);
  }

  if (!ready || !user) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={favorite ? `Your team: ${favorite}` : "Select your team"}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex h-8 max-w-[9rem] items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 transition-colors hover:bg-zinc-50 sm:max-w-none sm:px-3 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/5"
      >
        {favorite ? <TeamFlag team={favorite} size={18} /> : <TeamIcon />}
        <span className="truncate">
          {favorite ? (
            <span className="hidden sm:inline">{favorite}</span>
          ) : (
            <span className="hidden sm:inline">Your team</span>
          )}
        </span>
      </button>

      {open && mounted
        ? createPortal(
            <>
              <div
                className="fixed inset-0 z-90"
                aria-hidden="true"
                onMouseDown={() => setOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="fixed z-100 w-[min(18rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-950"
                style={{ top: popoverPos.top, right: popoverPos.right }}
              >
                <div className="border-b border-zinc-200 px-3 py-2.5 dark:border-white/10">
                  <h2 id={titleId} className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                    Select your team
                  </h2>
                  <input
                    ref={searchRef}
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search countries…"
                    className="mt-2 h-8 w-full rounded-lg border-0 bg-zinc-100 px-2.5 text-xs text-zinc-900 outline-none ring-1 ring-zinc-200/80 placeholder:text-zinc-400 focus:ring-2 focus:ring-sky-500/40 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-white/10 dark:placeholder:text-zinc-500 dark:focus:ring-sky-400/30"
                  />
                </div>

                <div
                  role="listbox"
                  aria-label="Teams"
                  className="max-h-[min(16rem,50vh)] overflow-y-auto p-1"
                >
                  {loading ? (
                    <p className="px-3 py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                      Loading teams…
                    </p>
                  ) : teams.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                      No teams available.
                    </p>
                  ) : filteredTeams.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                      No matches for &ldquo;{search.trim()}&rdquo;
                    </p>
                  ) : (
                    filteredTeams.map((team) => {
                      const selected = team === favorite;
                      return (
                        <button
                          key={team}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          disabled={saving}
                          onClick={() => void pickTeam(team)}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors disabled:opacity-60 ${
                            selected
                              ? "bg-sky-50 text-sky-900 dark:bg-sky-500/15 dark:text-sky-100"
                              : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                          }`}
                        >
                          <TeamFlag team={team} size={20} />
                          <span className="min-w-0 flex-1 truncate font-medium">{team}</span>
                          {selected ? (
                            <span className="shrink-0 text-[10px] text-sky-600 dark:text-sky-400">
                              ✓
                            </span>
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>

                {err ? (
                  <p className="border-t border-zinc-200 px-3 py-2 text-[11px] text-red-600 dark:border-white/10 dark:text-red-400">
                    {err}
                  </p>
                ) : null}
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
