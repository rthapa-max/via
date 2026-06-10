import {
  PREDICTION_CLOSES_BEFORE_MS,
  PREDICTION_OPENS_BEFORE_MS,
  getPredictionWindowState,
  kickoffAtIsoFromFixture,
  kickoffMsFromFixture,
  parseDateLabelParts,
  parseTimeParts,
} from "./kickoff.mjs";

export type PredictionWindowState = {
  open: boolean;
  reason: string | null;
  opensAt: number | null;
  closesAt: number | null;
};

export type KickoffFixtureInput = {
  dateLabel?: string;
  date_label?: string;
  time: string;
};

export function kickoffMsFromFixtureRow(fixture: KickoffFixtureInput): number | null {
  const dateLabel = fixture.dateLabel ?? fixture.date_label ?? "";
  return kickoffMsFromFixture({ dateLabel, time: fixture.time });
}

/** Kickoff label in the viewer's local timezone — no fixed source timezone shown. */
export function formatKickoffLocal(kickoffMs: number | null) {
  if (kickoffMs === null || !Number.isFinite(kickoffMs)) return null;
  try {
    const kickoff = new Date(kickoffMs);
    const date = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(kickoff);
    const time = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(kickoff);
    return `${date} · ${time}`;
  } catch {
    return null;
  }
}

export {
  PREDICTION_CLOSES_BEFORE_MS,
  PREDICTION_OPENS_BEFORE_MS,
  getPredictionWindowState,
  kickoffAtIsoFromFixture,
  kickoffMsFromFixture,
  parseDateLabelParts,
  parseTimeParts,
};
