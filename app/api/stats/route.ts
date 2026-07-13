import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type {
  FunAwardResult,
  FunAwards,
  PlayerStatsRow,
  StatsResponse,
  TournamentTotals,
  YourStats,
} from "@/lib/stats";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 1000;
/** Minimum sample size before a player qualifies for a rate-based fun award (avoids one-pick flukes). */
const MIN_QUALIFYING_PREDICTIONS = 10;

async function fetchAllRows<T>(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  table: string,
  select: string,
): Promise<T[]> {
  const out: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return out;
}

async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(getSessionCookieName())?.value;
  if (!token) return null;
  try {
    const session = await verifySession(token);
    return session.id;
  } catch {
    return null;
  }
}

type PredictionRow = {
  user_id: string;
  fixture_id: string;
  winner: "home" | "away" | "draw";
  home_score: number;
  away_score: number;
};

type PointsRow = {
  user_id: string;
  fixture_id: string;
  predicted_winner: "home" | "away" | "draw";
  predicted_home_score: number;
  predicted_away_score: number;
  fixture_status: string;
  result_home_score: number | null;
  result_away_score: number | null;
  points: number | null;
};

type UserRow = {
  id: string;
  email: string | null;
  username: string | null;
  favorite_team: string | null;
};

function displayName(user: UserRow | undefined) {
  if (!user) return "Player";
  if (user.username) return user.username;
  if (user.email) return user.email.split("@")[0] ?? user.email;
  return "Player";
}

type UserAgg = {
  totalPredictions: number;
  totalGoalsPicked: number;
  drawPicks: number;
  finishedCount: number;
  exactCount: number;
  nearMissCount: number;
  wrongCount: number;
};

function newAgg(): UserAgg {
  return {
    totalPredictions: 0,
    totalGoalsPicked: 0,
    drawPicks: 0,
    finishedCount: 0,
    exactCount: 0,
    nearMissCount: 0,
    wrongCount: 0,
  };
}

export async function GET() {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (e) {
    const body: StatsResponse = {
      ok: false,
      message: e instanceof Error ? e.message : "Server is not configured.",
    };
    return NextResponse.json(body, { status: 500 });
  }

  try {
    const [predictions, pointRows, users, sessionUserId] = await Promise.all([
      fetchAllRows<PredictionRow>(
        supabase,
        "predictions",
        "user_id,fixture_id,winner,home_score,away_score",
      ),
      fetchAllRows<PointsRow>(
        supabase,
        "prediction_points",
        "user_id,fixture_id,predicted_winner,predicted_home_score,predicted_away_score,fixture_status,result_home_score,result_away_score,points",
      ),
      fetchAllRows<UserRow>(supabase, "app_users", "id,email,username,favorite_team"),
      getSessionUserId(),
    ]);

    const usersById = new Map(users.map((u) => [u.id, u]));
    const finishedPoints = pointRows.filter((r) => r.fixture_status === "finished" && r.points != null);

    const aggByUser = new Map<string, UserAgg>();
    const getAgg = (userId: string) => {
      let agg = aggByUser.get(userId);
      if (!agg) {
        agg = newAgg();
        aggByUser.set(userId, agg);
      }
      return agg;
    };

    const scorelineCounts = new Map<string, number>();
    let drawPicks = 0;

    for (const p of predictions) {
      const agg = getAgg(p.user_id);
      agg.totalPredictions++;
      agg.totalGoalsPicked += p.home_score + p.away_score;
      if (p.winner === "draw") {
        agg.drawPicks++;
        drawPicks++;
      }

      const scoreline = `${p.home_score}-${p.away_score}`;
      scorelineCounts.set(scoreline, (scorelineCounts.get(scoreline) ?? 0) + 1);
    }

    const pointsByUser = new Map<string, number>();

    for (const r of finishedPoints) {
      const agg = getAgg(r.user_id);
      agg.finishedCount++;
      pointsByUser.set(r.user_id, (pointsByUser.get(r.user_id) ?? 0) + (r.points ?? 0));

      const exact =
        r.predicted_home_score === r.result_home_score && r.predicted_away_score === r.result_away_score;
      if (exact) {
        agg.exactCount++;
        continue;
      }

      const actualOutcome =
        r.result_home_score == null || r.result_away_score == null
          ? null
          : r.result_home_score > r.result_away_score
            ? "home"
            : r.result_home_score < r.result_away_score
              ? "away"
              : "draw";

      if (actualOutcome && r.predicted_winner === actualOutcome) agg.nearMissCount++;
      else agg.wrongCount++;
    }

    // ---- Players table + tournament totals ----
    const players: PlayerStatsRow[] = [...aggByUser.entries()]
      .map(([userId, agg]) => ({
        id: userId,
        name: displayName(usersById.get(userId)),
        favoriteTeam: usersById.get(userId)?.favorite_team ?? null,
        points: pointsByUser.get(userId) ?? 0,
        predictions: agg.totalPredictions,
        correct: agg.exactCount,
        wrong: agg.wrongCount,
        draws: agg.drawPicks,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.correct !== a.correct) return b.correct - a.correct;
        if (b.predictions !== a.predictions) return b.predictions - a.predictions;
        return a.name.localeCompare(b.name);
      });

    const totals: TournamentTotals = players.reduce(
      (acc, p) => {
        acc.predictions += p.predictions;
        acc.correct += p.correct;
        acc.wrong += p.wrong;
        acc.draws += p.draws;
        acc.points += p.points;
        return acc;
      },
      { players: players.length, predictions: 0, correct: 0, wrong: 0, draws: 0, points: 0 },
    );

    let you: YourStats = null;
    if (sessionUserId) {
      const rank = players.findIndex((p) => p.id === sessionUserId);
      if (rank >= 0) {
        const player = players[rank];
        const agg = aggByUser.get(sessionUserId) ?? newAgg();
        you = {
          rank: rank + 1,
          totalPlayers: players.length,
          points: player.points,
          predictions: player.predictions,
          correct: player.correct,
          wrong: player.wrong,
          draws: player.draws,
          exactRate: agg.finishedCount > 0 ? agg.exactCount / agg.finishedCount : 0,
          correctOrBetterRate:
            agg.finishedCount > 0 ? (agg.exactCount + agg.nearMissCount) / agg.finishedCount : 0,
        };
      }
    }

    // ---- Fun awards ----
    function pickAward<T extends { name: string }>(
      entries: T[],
      score: (v: T) => number,
      higherIsBetter: boolean,
    ): T | null {
      let best: T | null = null;
      let bestScore = higherIsBetter ? -Infinity : Infinity;
      for (const entry of entries) {
        const s = score(entry);
        if (higherIsBetter ? s > bestScore : s < bestScore) {
          bestScore = s;
          best = entry;
        }
      }
      return best;
    }

    function toAward<T extends { name: string }>(
      entry: T | null,
      display: (entry: T) => string,
    ): FunAwardResult {
      if (!entry) return null;
      return { name: entry.name, display: display(entry) };
    }

    const userEntries = [...aggByUser.entries()].map(([userId, agg]) => ({
      name: displayName(usersById.get(userId)),
      points: pointsByUser.get(userId) ?? 0,
      agg,
    }));

    const qualified = userEntries.filter((e) => e.agg.totalPredictions >= MIN_QUALIFYING_PREDICTIONS);
    const qualifiedFinished = userEntries.filter(
      (e) => e.agg.finishedCount >= MIN_QUALIFYING_PREDICTIONS,
    );

    const oracle = toAward(
      pickAward(qualifiedFinished, (e) => e.agg.exactCount / e.agg.finishedCount, true),
      (e) => `${Math.round((e.agg.exactCount / e.agg.finishedCount) * 100)}% exact`,
    );

    const woodenSpoon = toAward(
      pickAward(qualified, (e) => e.points, false),
      (e) => `${e.points} pt${e.points === 1 ? "" : "s"}`,
    );

    const fenceSitter = toAward(
      pickAward(qualified, (e) => e.agg.drawPicks / e.agg.totalPredictions, true),
      (e) => `${Math.round((e.agg.drawPicks / e.agg.totalPredictions) * 100)}% draw picks`,
    );

    const soClose = toAward(
      pickAward(userEntries, (e) => e.agg.nearMissCount, true),
      (e) => `${e.agg.nearMissCount} near miss${e.agg.nearMissCount === 1 ? "" : "es"}`,
    );

    const chaosAgent = toAward(
      pickAward(userEntries, (e) => e.agg.wrongCount, true),
      (e) => `${e.agg.wrongCount} wrong call${e.agg.wrongCount === 1 ? "" : "s"}`,
    );

    const completionist = toAward(
      pickAward(userEntries, (e) => e.agg.totalPredictions, true),
      (e) => `${e.agg.totalPredictions} prediction${e.agg.totalPredictions === 1 ? "" : "s"}`,
    );

    const goalRush = toAward(
      pickAward(qualified, (e) => e.agg.totalGoalsPicked / e.agg.totalPredictions, true),
      (e) => `${(e.agg.totalGoalsPicked / e.agg.totalPredictions).toFixed(1)} goals/match picked`,
    );

    const lockdownDefender = toAward(
      pickAward(qualified, (e) => e.agg.totalGoalsPicked / e.agg.totalPredictions, false),
      (e) => `${(e.agg.totalGoalsPicked / e.agg.totalPredictions).toFixed(1)} goals/match picked`,
    );

    let mostPopularScoreline: FunAwards["facts"]["mostPopularScoreline"] = null;
    for (const [scoreline, count] of scorelineCounts) {
      if (!mostPopularScoreline || count > mostPopularScoreline.count) {
        mostPopularScoreline = { scoreline, count };
      }
    }

    const totalGoalsPickedOverall = predictions.reduce((sum, p) => sum + p.home_score + p.away_score, 0);

    const fun: FunAwards = {
      oracle,
      woodenSpoon,
      fenceSitter,
      soClose,
      chaosAgent,
      completionist,
      goalRush,
      lockdownDefender,
      facts: {
        avgPredictedGoalsPerMatch:
          predictions.length > 0 ? totalGoalsPickedOverall / predictions.length : 0,
        drawPredictionRate: predictions.length > 0 ? drawPicks / predictions.length : 0,
        mostPopularScoreline,
      },
    };

    const body: StatsResponse = { ok: true, totals, players, you, fun };
    return NextResponse.json(body);
  } catch (e) {
    const body: StatsResponse = {
      ok: false,
      message: e instanceof Error ? e.message : "Failed to load stats.",
    };
    return NextResponse.json(body, { status: 500 });
  }
}
