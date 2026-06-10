import { PREDICTION_CLOSES_BEFORE_MS } from "@/lib/kickoff";
import { sendPredictionWindowClosedEmail } from "@/lib/resend";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type FixtureRow = {
  id: string;
  home: string;
  away: string;
  date_label: string;
  time: string;
  city: string | null;
  kickoff_at: string;
};

type PredictionRow = {
  home_score: number;
  away_score: number;
  winner: "home" | "away" | "draw";
  user_id: string;
};

type UserRow = {
  id: string;
  email: string | null;
  username: string | null;
};

function userDisplay(user: UserRow) {
  if (user.username) return `@${user.username}`;
  return user.email ?? "Unknown user";
}

function winnerLabel(home: string, away: string, winner: PredictionRow["winner"]) {
  if (winner === "draw") return "Draw";
  if (winner === "home") return home;
  return away;
}

export async function processPredictionWindowClosures(nowMs = Date.now()) {
  const supabase = getSupabaseServerClient();
  const cutoffIso = new Date(nowMs + PREDICTION_CLOSES_BEFORE_MS).toISOString();

  const { data: fixtures, error: fixturesErr } = await supabase
    .from("fixtures")
    .select("id,home,away,date_label,time,city,kickoff_at")
    .is("prediction_close_notified_at", null)
    .not("kickoff_at", "is", null)
    .lte("kickoff_at", cutoffIso);

  if (fixturesErr) throw new Error(fixturesErr.message);

  const due = (fixtures ?? []) as FixtureRow[];
  const results: { fixtureId: string; sent: boolean; reason?: string }[] = [];

  console.log("[prediction-close] scan", {
    now: new Date(nowMs).toISOString(),
    cutoffIso,
    candidateCount: due.length,
    fixtureIds: due.map((f) => f.id),
  });

  for (const fixture of due) {
    const kickoffMs = new Date(fixture.kickoff_at).getTime();
    const closesAt = kickoffMs - PREDICTION_CLOSES_BEFORE_MS;
    if (nowMs < closesAt) {
      results.push({ fixtureId: fixture.id, sent: false, reason: "window still open" });
      continue;
    }

    const { data: predictions, error: predErr } = await supabase
      .from("predictions")
      .select("home_score,away_score,winner,user_id")
      .eq("fixture_id", fixture.id);

    if (predErr) {
      results.push({ fixtureId: fixture.id, sent: false, reason: predErr.message });
      continue;
    }

    const predRows = (predictions ?? []) as PredictionRow[];
    const userIds = [...new Set(predRows.map((p) => p.user_id))];

    const usersById = new Map<string, UserRow>();
    if (userIds.length > 0) {
      const { data: users, error: usersErr } = await supabase
        .from("app_users")
        .select("id,email,username")
        .in("id", userIds);

      if (usersErr) {
        results.push({ fixtureId: fixture.id, sent: false, reason: usersErr.message });
        continue;
      }

      for (const user of (users ?? []) as UserRow[]) {
        usersById.set(user.id, user);
      }
    }

    try {
      console.log("[prediction-close] emailing fixture", {
        fixtureId: fixture.id,
        match: `${fixture.home} vs ${fixture.away}`,
        predictionCount: predRows.length,
        closesAt: new Date(closesAt).toISOString(),
      });

      await sendPredictionWindowClosedEmail({
        home: fixture.home,
        away: fixture.away,
        dateLabel: fixture.date_label,
        time: fixture.time,
        city: fixture.city,
        closedAt: new Date(closesAt).toISOString(),
        predictions: predRows.map((p) => {
          const user = usersById.get(p.user_id);
          return {
            userDisplay: user ? userDisplay(user) : "Unknown user",
            homeScore: p.home_score,
            awayScore: p.away_score,
            winner: winnerLabel(fixture.home, fixture.away, p.winner),
          };
        }),
      });

      console.log("[prediction-close] email ok", {
        fixtureId: fixture.id,
        match: `${fixture.home} vs ${fixture.away}`,
      });
    } catch (emailErr) {
      const message = emailErr instanceof Error ? emailErr.message : "Failed to send email";
      console.error("[prediction-close] email failed", {
        fixtureId: fixture.id,
        match: `${fixture.home} vs ${fixture.away}`,
        message,
        error: emailErr,
      });
      results.push({ fixtureId: fixture.id, sent: false, reason: message });
      continue;
    }

    const { error: markErr } = await supabase
      .from("fixtures")
      .update({ prediction_close_notified_at: new Date().toISOString() })
      .eq("id", fixture.id)
      .is("prediction_close_notified_at", null);

    if (markErr) {
      results.push({ fixtureId: fixture.id, sent: false, reason: markErr.message });
      continue;
    }

    results.push({ fixtureId: fixture.id, sent: true });
  }

  return {
    checked: due.length,
    sent: results.filter((r) => r.sent).length,
    results,
  };
}
