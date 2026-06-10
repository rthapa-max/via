const MONTHS = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

export const PREDICTION_OPENS_BEFORE_MS = 3 * 24 * 60 * 60 * 1000;
export const PREDICTION_CLOSES_BEFORE_MS = 1 * 60 * 60 * 1000;

export function parseDateLabelParts(dateLabel) {
  const parts = dateLabel.trim().split(/\s+/);
  if (parts.length < 4) return null;
  const day = Number(parts[1]);
  const month = MONTHS[parts[2]?.toLowerCase()];
  const year = Number(parts[3]);
  if (!Number.isFinite(day) || !Number.isFinite(year) || month === undefined) return null;
  return { year, month, day };
}

export function parseTimeParts(time) {
  const m = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return { hour, minute };
}

/** date_label + time are used as-is (no host-city timezone conversion). */
export function kickoffMsFromFixture({ dateLabel, time }) {
  const date = parseDateLabelParts(dateLabel);
  const clock = parseTimeParts(time);
  if (!date || !clock) return null;
  return Date.UTC(date.year, date.month, date.day, clock.hour, clock.minute);
}

export function kickoffAtIsoFromFixture(fixture) {
  const ms = kickoffMsFromFixture(fixture);
  return ms === null ? null : new Date(ms).toISOString();
}

export function getPredictionWindowState(kickoffMs, nowMs = Date.now()) {
  if (!Number.isFinite(kickoffMs)) {
    return { open: false, reason: "Kickoff time unavailable.", opensAt: null, closesAt: null };
  }

  const opensAt = kickoffMs - PREDICTION_OPENS_BEFORE_MS;
  const closesAt = kickoffMs - PREDICTION_CLOSES_BEFORE_MS;

  if (nowMs < opensAt) {
    return { open: false, reason: "Predictions open 3 days before kickoff.", opensAt, closesAt };
  }
  if (nowMs > closesAt) {
    return { open: false, reason: "Predictions closed 1 hour before kickoff.", opensAt, closesAt };
  }

  return { open: true, reason: null, opensAt, closesAt };
}
