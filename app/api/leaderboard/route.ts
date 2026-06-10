import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

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

  const { data: users, error: usersError } = await supabase
    .from("app_users")
    .select("id,email,username,favorite_team")
    .limit(200);

  if (usersError) {
    return NextResponse.json({ ok: false, message: usersError.message }, { status: 500 });
  }

  const [{ data: pointRows, error: pointsError }, { data: predictionRows, error: predictionsError }] =
    await Promise.all([
      supabase.from("prediction_points").select("user_id,points"),
      supabase.from("predictions").select("user_id"),
    ]);

  if (pointsError) {
    return NextResponse.json({ ok: false, message: pointsError.message }, { status: 500 });
  }

  if (predictionsError) {
    return NextResponse.json({ ok: false, message: predictionsError.message }, { status: 500 });
  }

  const pointsByUser = new Map<string, number>();
  for (const row of pointRows ?? []) {
    if (row.points == null) continue;
    const userId = row.user_id as string;
    pointsByUser.set(userId, (pointsByUser.get(userId) ?? 0) + Number(row.points));
  }

  const predictionsByUser = new Map<string, number>();
  for (const row of predictionRows ?? []) {
    const userId = row.user_id as string;
    predictionsByUser.set(userId, (predictionsByUser.get(userId) ?? 0) + 1);
  }

  const rows = (users ?? [])
    .map((user) => ({
      email: user.email as string,
      username: (user.username as string | null) ?? null,
      favorite_team: (user.favorite_team as string | null) ?? null,
      predictions: predictionsByUser.get(user.id as string) ?? 0,
      points: pointsByUser.get(user.id as string) ?? 0,
    }))
    .sort((a, b) => {
      const byPoints = b.points - a.points;
      if (byPoints !== 0) return byPoints;
      const nameA = a.username ?? a.email;
      const nameB = b.username ?? b.email;
      return nameA.localeCompare(nameB);
    });

  return NextResponse.json({ ok: true, rows });
}
