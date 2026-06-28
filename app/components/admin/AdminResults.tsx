"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { compareByDateAndTime } from "@/lib/fixtures";
import { isKnockoutStage, isParticipantTeam } from "@/lib/teams";

type FixtureRow = {
  id: string;
  date_label: string;
  time: string;
  home: string;
  away: string;
  stage: string | null;
  status: "scheduled" | "pending" | "finished";
  result_home_score: number | null;
  result_away_score: number | null;
};

function normalizeScore(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.replace(/^0+(?=\d)/, "");
}

function pickButtonClass(active: boolean, disabled?: boolean) {
  return [
    "min-w-0 truncate rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
    active
      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950"
      : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/5",
    disabled ? "cursor-not-allowed opacity-60" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function OutcomePicker({
  label,
  homeLabel,
  awayLabel,
  value,
  onChange,
  disabled,
  includeDraw = false,
}: {
  label: string;
  homeLabel: string;
  awayLabel: string;
  value: "home" | "away" | "draw" | "";
  onChange: (next: "home" | "away" | "draw") => void;
  disabled?: boolean;
  includeDraw?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">{label}</p>
      <div className={includeDraw ? "grid grid-cols-3 gap-1.5" : "grid grid-cols-2 gap-1.5"}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("home")}
          className={pickButtonClass(value === "home", disabled)}
        >
          {homeLabel}
        </button>
        {includeDraw ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange("draw")}
            className={pickButtonClass(value === "draw", disabled)}
          >
            Draw
          </button>
        ) : null}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("away")}
          className={pickButtonClass(value === "away", disabled)}
        >
          {awayLabel}
        </button>
      </div>
    </div>
  );
}

function AdminResultRow({
  row,
  busy,
  availableTeams,
  onSaveStatus,
  onComplete,
  onUpdateTeams,
}: {
  row: FixtureRow;
  busy: boolean;
  availableTeams: string[];
  onSaveStatus: (args: { id: string; status: "scheduled" | "pending" }) => void;
  onComplete: (args: {
    id: string;
    hs: string;
    as: string;
    etWinner?: "home" | "away" | null;
    penWinner?: "home" | "away" | null;
  }) => void;
  onUpdateTeams: (args: { id: string; home: string; away: string }) => void;
}) {
  const isFinished = row.status === "finished";
  const isKnockout = isKnockoutStage(row.stage);
  const [hs, setHs] = useState(row.result_home_score === null ? "" : String(row.result_home_score));
  const [as, setAs] = useState(row.result_away_score === null ? "" : String(row.result_away_score));
  const [homeTeam, setHomeTeam] = useState(row.home);
  const [awayTeam, setAwayTeam] = useState(row.away);
  const [status, setStatus] = useState<"scheduled" | "pending">(
    row.status === "pending" ? "pending" : "scheduled",
  );
  const [etWinner, setEtWinner] = useState<"home" | "away" | "draw" | "">("");
  const [penWinner, setPenWinner] = useState<"home" | "away" | "">("");

  useEffect(() => {
    setHs(row.result_home_score === null ? "" : String(row.result_home_score));
    setAs(row.result_away_score === null ? "" : String(row.result_away_score));
    setHomeTeam(row.home);
    setAwayTeam(row.away);
    setStatus(row.status === "pending" ? "pending" : "scheduled");
    setEtWinner("");
    setPenWinner("");
  }, [row.away, row.home, row.id, row.result_away_score, row.result_home_score, row.status]);

  const hsNum = hs === "" ? NaN : Number(hs);
  const asNum = as === "" ? NaN : Number(as);
  const knockoutDrawInput =
    isKnockout && Number.isFinite(hsNum) && Number.isFinite(asNum) && hsNum === asNum;
  const canCompleteKnockoutDraw =
    knockoutDrawInput &&
    (etWinner === "home" ||
      etWinner === "away" ||
      (etWinner === "draw" && (penWinner === "home" || penWinner === "away")));

  function handleEtPick(next: "home" | "away" | "draw") {
    setEtWinner(next);
    if (next !== "draw") setPenWinner("");
  }

  const teamsDirty = homeTeam !== row.home || awayTeam !== row.away;
  const homeSelectValue = isParticipantTeam(homeTeam) ? homeTeam : "";
  const awaySelectValue = isParticipantTeam(awayTeam) ? awayTeam : "";
  const canSaveTeams =
    teamsDirty &&
    isParticipantTeam(homeTeam) &&
    isParticipantTeam(awayTeam) &&
    availableTeams.includes(homeTeam) &&
    availableTeams.includes(awayTeam);

  return (
    <tr className="align-top">
      <td className="px-4 py-2">
        {isKnockout ? (
          <div className="space-y-2">
            {row.stage ? (
              <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {row.stage}
              </div>
            ) : null}
            <div className="grid max-w-xs grid-cols-[1fr_auto_1fr] items-center gap-2">
              <select
                value={homeSelectValue}
                onChange={(e) => setHomeTeam(e.target.value)}
                disabled={busy || availableTeams.length === 0}
                className="h-8 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-2 text-xs dark:border-white/10 dark:bg-zinc-950"
              >
                <option value="">
                  {isParticipantTeam(row.home) ? "Select home team" : row.home}
                </option>
                {availableTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
              <div className="text-center text-zinc-500 dark:text-zinc-400">vs</div>
              <select
                value={awaySelectValue}
                onChange={(e) => setAwayTeam(e.target.value)}
                disabled={busy || availableTeams.length === 0}
                className="h-8 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-2 text-xs dark:border-white/10 dark:bg-zinc-950"
              >
                <option value="">
                  {isParticipantTeam(row.away) ? "Select away team" : row.away}
                </option>
                {availableTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
            {teamsDirty ? (
              <button
                type="button"
                onClick={() => onUpdateTeams({ id: row.id, home: homeTeam, away: awayTeam })}
                disabled={busy || !canSaveTeams}
                className="inline-flex h-8 items-center justify-center rounded-full border border-zinc-200 bg-white px-3 text-xs text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/5"
              >
                {busy ? "Saving…" : "Save teams"}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="font-normal text-zinc-900 dark:text-zinc-50">
            {row.home} vs {row.away}
          </div>
        )}
      </td>
      <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
        {row.date_label} • {row.time}
      </td>
      <td className="px-4 py-2">
        {isFinished ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            finished
          </span>
        ) : (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "scheduled" | "pending")}
            className="h-8 rounded-xl border border-zinc-200 bg-white px-2 text-xs dark:border-white/10 dark:bg-zinc-950"
          >
            <option value="scheduled">scheduled</option>
            <option value="pending">pending</option>
          </select>
        )}
      </td>
      <td className="px-4 py-2">
        <div className="space-y-2">
          <div className="grid grid-cols-[90px_20px_90px] items-center gap-2">
            <input
              value={hs}
              onChange={(e) => setHs(normalizeScore(e.target.value))}
              placeholder="0"
              inputMode="numeric"
              disabled={isFinished}
              className="h-8 rounded-xl border border-zinc-200 bg-white px-2 text-xs disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950"
            />
            <div className="text-center text-zinc-500 dark:text-zinc-400">-</div>
            <input
              value={as}
              onChange={(e) => setAs(normalizeScore(e.target.value))}
              placeholder="0"
              inputMode="numeric"
              disabled={isFinished}
              className="h-8 rounded-xl border border-zinc-200 bg-white px-2 text-xs disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950"
            />
          </div>
          {isKnockout && !isFinished ? (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">90-minute score</p>
          ) : null}
          {knockoutDrawInput && !isFinished ? (
            <div className="max-w-xs space-y-2.5 rounded-xl border border-zinc-200 p-2.5 dark:border-white/10">
              <OutcomePicker
                label="Extra time winner"
                homeLabel={row.home}
                awayLabel={row.away}
                value={etWinner}
                onChange={handleEtPick}
                disabled={busy}
                includeDraw
              />
              {etWinner === "draw" ? (
                <OutcomePicker
                  label="Penalties winner"
                  homeLabel={row.home}
                  awayLabel={row.away}
                  value={penWinner}
                  onChange={(next) => setPenWinner(next as "home" | "away")}
                  disabled={busy}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-2">
        <div className="flex flex-wrap gap-2">
          {!isFinished ? (
            <button
              type="button"
              onClick={() => onSaveStatus({ id: row.id, status })}
              disabled={busy}
              className="inline-flex h-8 items-center justify-center rounded-full border border-zinc-200 bg-white px-3 text-xs text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/5"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          ) : null}
          {!isFinished ? (
            <button
              type="button"
              onClick={() =>
                onComplete({
                  id: row.id,
                  hs,
                  as,
                  etWinner: etWinner === "home" || etWinner === "away" ? etWinner : null,
                  penWinner: etWinner === "draw" ? penWinner || null : null,
                })
              }
              disabled={busy || (knockoutDrawInput && !canCompleteKnockoutDraw)}
              className="inline-flex h-8 items-center justify-center rounded-full bg-zinc-950 px-3 text-xs text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {busy ? "Saving…" : "Complete"}
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export function AdminResults() {
  const { user, ready } = useAuth();
  const [rows, setRows] = useState<FixtureRow[]>([]);
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [fixturesRes, teamsRes] = await Promise.all([
        fetch("/api/fixtures", { cache: "no-store" }).catch(() => null),
        fetch("/api/teams", { cache: "no-store" }).catch(() => null),
      ]);

      const fixturesJson = (await fixturesRes?.json().catch(() => null)) as
        | { ok: true; fixtures: FixtureRow[] }
        | { ok: false; message: string }
        | null;
      const teamsJson = (await teamsRes?.json().catch(() => null)) as
        | { ok: true; teams: string[] }
        | { ok: false; message: string }
        | null;

      if (!fixturesRes || !fixturesJson || !fixturesJson.ok) {
        setRows([]);
      } else {
        setRows(fixturesJson.fixtures ?? []);
      }

      setAvailableTeams(teamsJson?.ok ? (teamsJson.teams ?? []) : []);
      setLoading(false);
    }
    void load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle
      ? rows.filter((r) =>
          `${r.home} ${r.away} ${r.date_label} ${r.time}`.toLowerCase().includes(needle),
        )
      : rows;
    return [...list].sort(compareByDateAndTime);
  }, [q, rows]);

  if (!ready) return <div className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</div>;
  if (!user) {
    return <div className="text-sm text-zinc-600 dark:text-zinc-400">Log in to access admin.</div>;
  }
  if (!user.isAdmin) {
    return <div className="text-sm text-zinc-600 dark:text-zinc-400">Not authorized.</div>;
  }

  async function saveStatus(id: string, status: "scheduled" | "pending") {
    setErr(null);
    setBusyId(id);
    const res = await fetch("/api/admin/results", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fixtureId: id, status }),
    }).catch(() => null);

    const json = (await res?.json().catch(() => null)) as
      | { ok: true }
      | { ok: false; message: string }
      | null;

    if (!res || !json || !json.ok) {
      setErr(json && "message" in json ? json.message : "Failed to save status.");
      setBusyId(null);
      return;
    }

    setRows((prev) => prev.map((r) => (r.id !== id ? r : { ...r, status })));
    setBusyId(null);
  }

  async function complete(
    id: string,
    hs: string,
    as: string,
    etWinner?: "home" | "away" | null,
    penWinner?: "home" | "away" | null,
  ) {
    setErr(null);
    setBusyId(id);
    const homeScore = hs === "" ? NaN : Number(hs);
    const awayScore = as === "" ? NaN : Number(as);
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore) || homeScore < 0 || awayScore < 0) {
      setErr("Enter valid scores before marking complete.");
      setBusyId(null);
      return;
    }

    const res = await fetch("/api/admin/results", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fixtureId: id,
        complete: true,
        homeScore: Math.floor(homeScore),
        awayScore: Math.floor(awayScore),
        etWinner: etWinner ?? null,
        penWinner: penWinner ?? null,
      }),
    }).catch(() => null);

    const json = (await res?.json().catch(() => null)) as
      | { ok: true }
      | { ok: false; message: string }
      | null;

    if (!res || !json || !json.ok) {
      setErr(json && "message" in json ? json.message : "Failed to complete match.");
      setBusyId(null);
      return;
    }

    setRows((prev) =>
      prev.map((r) =>
        r.id !== id
          ? r
          : {
              ...r,
              status: "finished",
              result_home_score: Math.floor(homeScore),
              result_away_score: Math.floor(awayScore),
            },
      ),
    );
    window.dispatchEvent(new Event("wc:predictions-changed"));
    setBusyId(null);
  }

  async function updateTeams(id: string, home: string, away: string) {
    setErr(null);
    setBusyId(id);
    const res = await fetch("/api/admin/fixture-teams", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fixtureId: id, home, away }),
    }).catch(() => null);

    const json = (await res?.json().catch(() => null)) as
      | { ok: true; fixture: { home: string; away: string } }
      | { ok: false; message: string }
      | null;

    if (!res || !json || !json.ok) {
      setErr(json && "message" in json ? json.message : "Failed to update teams.");
      setBusyId(null);
      return;
    }

    setRows((prev) =>
      prev.map((r) =>
        r.id !== id ? r : { ...r, home: json.fixture.home, away: json.fixture.away },
      ),
    );
    setBusyId(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search (team, date, time)…"
          className="h-9 w-full max-w-md rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/20"
        />
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-500/20 dark:bg-red-950/40 dark:text-red-200">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">Loading fixtures…</div>
      ) : (
        <div className="overflow-auto rounded-2xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
              <tr>
                <th className="px-4 py-2 font-normal">Match</th>
                <th className="px-4 py-2 font-normal">When</th>
                <th className="px-4 py-2 font-normal">Status</th>
                <th className="px-4 py-2 font-normal">Result</th>
                <th className="px-4 py-2 font-normal" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800 dark:divide-white/10 dark:text-zinc-200">
              {filtered.slice(0, 200).map((r) => (
                <AdminResultRow
                  key={r.id}
                  row={r}
                  busy={busyId === r.id}
                  availableTeams={availableTeams}
                  onSaveStatus={({ id, status }) => void saveStatus(id, status)}
                  onComplete={({ id, hs, as, etWinner, penWinner }) =>
                    void complete(id, hs, as, etWinner, penWinner)
                  }
                  onUpdateTeams={({ id, home, away }) => void updateTeams(id, home, away)}
                />
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 text-xs text-zinc-500 dark:text-zinc-400">
            Showing up to 200 matches.
          </div>
        </div>
      )}
    </div>
  );
}
