import { NextResponse } from "next/server";
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

export async function GET() {
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
    const [users, pointRows, predictionRows] = await Promise.all([
      fetchAllRows<{
        id: string;
        email: string | null;
        username: string | null;
        favorite_team: string | null;
      }>(supabase, "app_users", "id,email,username,favorite_team"),
      fetchAllRows<{ user_id: string; points: number | null }>(
        supabase,
        "prediction_points",
        "user_id,points",
      ),
      fetchAllRows<{ user_id: string }>(supabase, "predictions", "user_id"),
    ]);

    const pointsByUser = new Map<string, number>();
    for (const row of pointRows) {
      if (row.points == null) continue;
      pointsByUser.set(row.user_id, (pointsByUser.get(row.user_id) ?? 0) + Number(row.points));
    }

    const predictionsByUser = new Map<string, number>();
    for (const row of predictionRows) {
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
