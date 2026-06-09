"use client";

import { useEffect, useMemo, useState } from "react";
import type { FixtureMatch } from "@/lib/fixtures";
import { flagUrlForTeam } from "@/lib/fixtures";
import { getPredictionWindowState, kickoffMsFromFixtureRow } from "@/lib/kickoff";
import { AuthModal } from "@/app/components/AuthModal";
import { useAuth } from "@/app/components/AuthProvider";

type WinnerPick = "home" | "away" | "draw";

type Prediction = {
  winner: WinnerPick;
  homeScore: number;
  awayScore: number;
  updatedAt: number;
};

function predictionKey(matchKey: string) {
  return `wc:prediction:${matchKey}`;
}

function getMatchKey(m: FixtureMatch) {
  // Must be stable across renders and unique in list.
  return `${m.dateLabel}|${m.time}|${m.home}|${m.away}|${m.stage ?? ""}|${m.group ?? ""}|${
    m.stadium ?? ""
  }`;
}

function TeamWithFlag({ team, reverse = false }: { team: string; reverse?: boolean }) {
  const flagUrl = flagUrlForTeam(team, 40);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 ${reverse ? "flex-row-reverse" : ""}`}
    >
      {flagUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={flagUrl}
          alt=""
          width={20}
          height={15}
          className="h-[15px] w-5 shrink-0 rounded-[2px] ring-1 ring-black/10 dark:ring-white/10"
          loading="lazy"
        />
      ) : null}
      <span className="whitespace-nowrap text-sm font-medium">{team}</span>
    </span>
  );
}

function formatLocation(stadium?: string, city?: string) {
  if (!stadium && !city) return undefined;
  if (stadium && city) return `${stadium} (${city})`;
  return stadium ?? city;
}

function winnerLabel(pick: WinnerPick, m: FixtureMatch) {
  if (pick === "draw") return "Draw";
  return pick === "home" ? m.home : m.away;
}

export function FixtureCard({ match }: { match: FixtureMatch }) {
  const matchKey = useMemo(() => getMatchKey(match), [match]);
  const fixtureId = match.id ?? matchKey;
  const { user, ready } = useAuth();

  const [authOpen, setAuthOpen] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  function normalizeScoreInput(raw: string) {
    const digitsOnly = raw.replace(/[^\d]/g, "");
    if (digitsOnly.length === 0) return "";
    // Remove leading zeros (but keep a single "0" if the whole input is zeros)
    const trimmed = digitsOnly.replace(/^0+(?=\d)/, "");
    return trimmed;
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(predictionKey(matchKey));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Prediction;
      if (
        parsed &&
        (parsed.winner === "home" || parsed.winner === "away" || parsed.winner === "draw") &&
        Number.isFinite(parsed.homeScore) &&
        Number.isFinite(parsed.awayScore)
      ) {
        setPrediction(parsed);
      }
    } catch {
      // ignore
    }
  }, [matchKey]);

  useEffect(() => {
    async function loadFromDb() {
      if (!user) return;
      const res = await fetch(`/api/predictions?fixtureId=${encodeURIComponent(fixtureId)}`, {
        cache: "no-store",
      }).catch(() => null);
      const json = (await res?.json().catch(() => null)) as
        | {
            ok: true;
            prediction: {
              winner: "home" | "away" | "draw";
              home_score: number;
              away_score: number;
              updated_at: string;
            } | null;
          }
        | { ok: false; message: string }
        | null;

      if (!res || !json || !json.ok || !json.prediction) return;
      const data = json.prediction;
      const next: Prediction = {
        winner:
          data.winner === "home" || data.winner === "away" || data.winner === "draw"
            ? data.winner
            : "draw",
        homeScore: Number(data.home_score ?? 0),
        awayScore: Number(data.away_score ?? 0),
        updatedAt: new Date(data.updated_at ?? Date.now()).getTime(),
      };
      setPrediction(next);
      setHomeScore(next.homeScore === 0 ? "" : String(next.homeScore));
      setAwayScore(next.awayScore === 0 ? "" : String(next.awayScore));
    }

    void loadFromDb();
  }, [fixtureId, user]);

  useEffect(() => {
    if (!user) {
      // Logged out: keep local draft empty, but show last local saved prediction if present.
      setServerError(null);
    }
  }, [user]);

  const kickoffMs = useMemo(() => {
    if (match.kickoffAt) return new Date(match.kickoffAt).getTime();
    return kickoffMsFromFixtureRow({ dateLabel: match.dateLabel, time: match.time });
  }, [match.dateLabel, match.kickoffAt, match.time]);

  const predictionWindow = useMemo(
    () => getPredictionWindowState(kickoffMs, nowMs),
    [kickoffMs, nowMs],
  );

  async function save() {
    if (!isPending || !predictionWindow.open) return;
    if (!user) {
      setAuthOpen(true);
      return;
    }
    const hs = homeScore === "" ? 0 : Number(homeScore);
    const as = awayScore === "" ? 0 : Number(awayScore);
    if (!Number.isFinite(hs) || !Number.isFinite(as) || hs < 0 || as < 0) return;

    setServerError(null);
    setSaving(true);

    const derivedWinner: WinnerPick = hs === as ? "draw" : hs > as ? "home" : "away";
    const next: Prediction = {
      winner: derivedWinner,
      homeScore: Math.floor(hs),
      awayScore: Math.floor(as),
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem(predictionKey(matchKey), JSON.stringify(next));
    } catch {
      // ignore
    }

    const res = await fetch("/api/predictions", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fixtureId,
        winner: next.winner,
        homeScore: next.homeScore,
        awayScore: next.awayScore,
      }),
    }).catch(() => null);

    const json = (await res?.json().catch(() => null)) as
      | { ok: true }
      | { ok: false; message: string }
      | null;

    if (!res || !json || !json.ok) {
      setServerError(json && "message" in json ? json.message : "Failed to save to server.");
      setSaving(false);
      return;
    }

    setPrediction(next);
    window.dispatchEvent(new Event("wc:predictions-changed"));
    setSaving(false);
  }

  async function clear() {
    setServerError(null);
    try {
      localStorage.removeItem(predictionKey(matchKey));
    } catch {
      // ignore
    }
    if (!user) {
      setAuthOpen(true);
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/predictions?fixtureId=${encodeURIComponent(fixtureId)}`, {
      method: "DELETE",
    }).catch(() => null);

    const json = (await res?.json().catch(() => null)) as
      | { ok: true }
      | { ok: false; message: string }
      | null;

    if (!res || !json || !json.ok) {
      setServerError(json && "message" in json ? json.message : "Failed to delete on server.");
      setSaving(false);
      return;
    }

    setPrediction(null);
    setHomeScore("");
    setAwayScore("");
    window.dispatchEvent(new Event("wc:predictions-changed"));
    setSaving(false);
  }

  const location = formatLocation(match.stadium, match.city);
  const fixtureStatus = match.status ?? "scheduled";
  const isPending = fixtureStatus === "pending";
  const isFinished = fixtureStatus === "finished";
  const canPredict = isPending && predictionWindow.open && ready && !!user && !saving;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <TeamWithFlag team={match.home} />
            <span className="text-xs font-medium text-zinc-300 dark:text-zinc-600">·</span>
            <TeamWithFlag team={match.away} reverse />
          </div>

          <div className="flex items-center justify-center gap-3">
          <input
            inputMode="numeric"
            value={homeScore}
            onChange={(e) => setHomeScore(normalizeScoreInput(e.target.value))}
            disabled={!canPredict}
            className="h-9 w-12 rounded-lg border border-zinc-200 bg-white px-1 text-center text-sm tabular-nums outline-none focus:ring-2 focus:ring-zinc-300 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/20"
            placeholder="0"
            aria-label={`${match.home} score`}
          />
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">vs</span>
          <input
            inputMode="numeric"
            value={awayScore}
            onChange={(e) => setAwayScore(normalizeScoreInput(e.target.value))}
            disabled={!canPredict}
            className="h-9 w-12 rounded-lg border border-zinc-200 bg-white px-1 text-center text-sm tabular-nums outline-none focus:ring-2 focus:ring-zinc-300 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/20"
            placeholder="0"
            aria-label={`${match.away} score`}
          />
          </div>
        </div>

        <div className="min-w-0">

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <span
              className={
                isPending
                  ? "rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  : isFinished
                    ? "rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                    : "rounded-full bg-sky-50 px-2 py-0.5 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
              }
            >
              {fixtureStatus}
            </span>
            <span className="font-normal text-zinc-800 dark:text-zinc-200">{match.time}</span>
            {match.stage ? <span>{match.stage}</span> : null}
            {match.group ? <span>{match.group}</span> : null}
          </div>

          {location ? (
            <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{location}</div>
          ) : null}

          {isPending && !predictionWindow.open && predictionWindow.reason ? (
            <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{predictionWindow.reason}</div>
          ) : null}

          {prediction ? (
            <div className="mt-2 text-xs text-zinc-700 dark:text-zinc-300">
              Predicted:{" "}
              <span className="font-normal text-zinc-900 dark:text-zinc-50">
                {winnerLabel(prediction.winner, match)} {prediction.homeScore}-{prediction.awayScore}
              </span>
            </div>
          ) : null}

          {serverError ? (
            <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-500/20 dark:bg-red-950/40 dark:text-red-200">
              {serverError}
            </div>
          ) : null}
        </div>

        <div className="border-t border-zinc-100 pt-3 dark:border-white/10">
          {!ready ? null : isFinished ? (
            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">Match finished</p>
          ) : !isPending ? (
            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">Predictions closed</p>
          ) : !predictionWindow.open ? (
            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">Outside prediction window</p>
          ) : !user ? (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="inline-flex h-9 w-full items-center justify-center rounded-full border border-zinc-200 bg-white text-xs text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/5"
            >
              Sign in to predict
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex h-9 w-full items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Saving…" : "Save prediction"}
            </button>
          )}
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

