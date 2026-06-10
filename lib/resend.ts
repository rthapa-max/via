import { Resend } from "resend";

export type PredictionEmailPayload = {
  userDisplay: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  winner: "home" | "away" | "draw";
  dateLabel: string;
  time: string;
  city?: string | null;
};

function winnerLabel(payload: PredictionEmailPayload) {
  if (payload.winner === "draw") return "Draw";
  if (payload.winner === "home") return payload.home;
  return payload.away;
}

function buildPredictionEmailHtml(payload: PredictionEmailPayload) {
  const score = `${payload.homeScore} – ${payload.awayScore}`;
  const winner = winnerLabel(payload);
  const when = [payload.dateLabel, payload.time, payload.city].filter(Boolean).join(" · ");

  return `
    <h2>New WC26 prediction saved</h2>
    <p><strong>${payload.userDisplay}</strong> submitted a prediction.</p>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <tr><td><strong>Match</strong></td><td>${payload.home} vs ${payload.away}</td></tr>
      <tr><td><strong>Score</strong></td><td>${score}</td></tr>
      <tr><td><strong>Winner</strong></td><td>${winner}</td></tr>
      <tr><td><strong>When</strong></td><td>${when}</td></tr>
    </table>
  `.trim();
}

export type PredictionWindowClosedPayload = {
  home: string;
  away: string;
  dateLabel: string;
  time: string;
  city?: string | null;
  closedAt: string;
  predictions: {
    userDisplay: string;
    homeScore: number;
    awayScore: number;
    winner: string;
  }[];
};

function buildPredictionWindowClosedHtml(payload: PredictionWindowClosedPayload) {
  const when = [payload.dateLabel, payload.time, payload.city].filter(Boolean).join(" · ");
  const closedAt = new Date(payload.closedAt).toUTCString();

  const rows =
    payload.predictions.length === 0
      ? "<tr><td colspan='3'>No predictions submitted.</td></tr>"
      : payload.predictions
          .map(
            (p) => `
      <tr>
        <td>${p.userDisplay}</td>
        <td>${p.homeScore} – ${p.awayScore}</td>
        <td>${p.winner}</td>
      </tr>`,
          )
          .join("");

  return `
    <h2>WC26 predictions closed</h2>
    <p>The prediction window has closed for <strong>${payload.home} vs ${payload.away}</strong> (1 hour before kickoff).</p>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin-bottom:12px">
      <tr><td><strong>Match</strong></td><td>${payload.home} vs ${payload.away}</td></tr>
      <tr><td><strong>When</strong></td><td>${when}</td></tr>
      <tr><td><strong>Closed at</strong></td><td>${closedAt}</td></tr>
      <tr><td><strong>Predictions</strong></td><td>${payload.predictions.length}</td></tr>
    </table>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse" border="1">
      <thead>
        <tr><th>User</th><th>Score</th><th>Winner</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `.trim();
}

export const PREDICTION_NOTIFY_EMAILS = [
  "rupakt525@gmail.com",
  "rupakisdeveloper@gmail.com",
] as const;

export function getPredictionNotifyEmails() {
  return [...PREDICTION_NOTIFY_EMAILS];
}

/** Sample closure email for testing Resend + template. */
export async function sendDemoPredictionWindowClosedEmail() {
  const to = getPredictionNotifyEmails();
  await sendPredictionWindowClosedEmail(
    {
      home: "Mexico",
      away: "South Africa",
      dateLabel: "Friday 12 June 2026",
      time: "00:45",
      city: "Mexico City",
      closedAt: new Date().toISOString(),
      predictions: [
        { userDisplay: "@demo_user", homeScore: 2, awayScore: 1, winner: "Mexico" },
        { userDisplay: "alice@example.com", homeScore: 1, awayScore: 1, winner: "Draw" },
      ],
    },
    { demo: true },
  );
  return to;
}

export async function sendPredictionWindowClosedEmail(
  payload: PredictionWindowClosedPayload,
  options?: { demo?: boolean },
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = getPredictionNotifyEmails();

  if (!apiKey || !from) {
    console.warn("[resend] Skipping email: RESEND_API_KEY or RESEND_FROM_EMAIL not set");
    return;
  }

  const prefix = options?.demo ? "[DEMO] " : "";
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `${prefix}WC26 predictions closed: ${payload.home} vs ${payload.away} (${payload.predictions.length})`,
    html: buildPredictionWindowClosedHtml(payload),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendPredictionCompleteEmail(payload: PredictionEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = getPredictionNotifyEmails();

  if (!apiKey || !from) {
    console.warn("[resend] Skipping email: RESEND_API_KEY or RESEND_FROM_EMAIL not set");
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `WC26 prediction: ${payload.home} ${payload.homeScore}-${payload.awayScore} ${payload.away}`,
    html: buildPredictionEmailHtml(payload),
  });

  if (error) {
    throw new Error(error.message);
  }
}
