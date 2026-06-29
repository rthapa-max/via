import { NextResponse } from "next/server";
import { isGroupStage, isKnockoutStage } from "@/lib/teams";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 1000;

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

function getStageFilter(param: string | null | undefined): "group" | "knockout" | "all" {
  const value = param?.trim().toLowerCase();
  if (value === "group") return "group";
  if (value === "all") return "all";
  return "knockout";
}

function fixtureMatchesStage(
  stage: string | null | undefined,
  filter: "group" | "knockout" | "all",
) {
  if (filter === "all") return true;
  return filter === "group" ? isGroupStage(stage) : isKnockoutStage(stage);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stageFilter = getStageFilter(searchParams.get("stage"));
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Server is not configured." },
      { status: 500 },
    );
  }

  try {
    const [users, pointRows, predictionRows, fixtures] = await Promise.all([
      fetchAllRows<{
        id: string;
        email: string | null;
        username: string | null;
        favorite_team: string | null;
      }>(supabase, "app_users", "id,email,username,favorite_team"),
      fetchAllRows<{ user_id: string; fixture_id: string; points: number | null }>(
        supabase,
        "prediction_points",
        "user_id,fixture_id,points",
      ),
      fetchAllRows<{ user_id: string; fixture_id: string }>(
        supabase,
        "predictions",
        "user_id,fixture_id",
      ),
      fetchAllRows<{ id: string; stage: string | null }>(supabase, "fixtures", "id,stage"),
    ]);

    const stageFixtureIds = new Set(
      fixtures
        .filter((fixture) => fixtureMatchesStage(fixture.stage, stageFilter))
        .map((fixture) => fixture.id),
    );

    const pointsByUser = new Map<string, number>();
    for (const row of pointRows) {
      if (row.points == null || !stageFixtureIds.has(row.fixture_id)) continue;
      pointsByUser.set(row.user_id, (pointsByUser.get(row.user_id) ?? 0) + Number(row.points));
    }

    const predictionsByUser = new Map<string, number>();
    for (const row of predictionRows) {
      if (!stageFixtureIds.has(row.fixture_id)) continue;
      predictionsByUser.set(row.user_id, (predictionsByUser.get(row.user_id) ?? 0) + 1);
    }

    const rows = users
      .map((user) => ({
        id: user.id,
        email: user.email ?? "",
        username: user.username ?? null,
        favorite_team: user.favorite_team ?? null,
        predictions: predictionsByUser.get(user.id) ?? 0,
        points: pointsByUser.get(user.id) ?? 0,
      }))
      .sort((a, b) => {
        const byPoints = b.points - a.points;
        if (byPoints !== 0) return byPoints;
        const nameA = a.username ?? a.email;
        const nameB = b.username ?? b.email;
        return nameA.localeCompare(nameB);
      });

    return NextResponse.json({ ok: true, rows });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Failed to load leaderboard." },
      { status: 500 },
    );
  }

}
