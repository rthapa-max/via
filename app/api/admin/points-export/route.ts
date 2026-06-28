import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { isKnockoutStage } from "@/lib/teams";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 1000;

function csvCell(value: string | number | null | undefined) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

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
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

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
    const [users, pointRows, fixtures] = await Promise.all([
      fetchAllRows<{
        id: string;
        email: string | null;
        username: string | null;
      }>(supabase, "app_users", "id,email,username"),
      fetchAllRows<{ user_id: string; fixture_id: string; points: number | null }>(
        supabase,
        "prediction_points",
        "user_id,fixture_id,points",
      ),
      fetchAllRows<{ id: string; stage: string | null }>(supabase, "fixtures", "id,stage"),
    ]);

    const knockoutFixtureIds = new Set(
      fixtures.filter((fixture) => isKnockoutStage(fixture.stage)).map((fixture) => fixture.id),
    );

    const pointsByUser = new Map<string, number>();
    for (const row of pointRows) {
      if (row.points == null || !knockoutFixtureIds.has(row.fixture_id)) continue;
      pointsByUser.set(row.user_id, (pointsByUser.get(row.user_id) ?? 0) + Number(row.points));
    }

    const rows = users
      .map((user) => ({
        user: user.username ?? user.email ?? "",
        total_points: pointsByUser.get(user.id) ?? 0,
      }))
      .filter((row) => row.user)
      .sort((a, b) => {
        const byPoints = b.total_points - a.total_points;
        if (byPoints !== 0) return byPoints;
        return a.user.localeCompare(b.user);
      });

    const lines = [
      "user,total_points",
      ...rows.map((row) => `${csvCell(row.user)},${csvCell(row.total_points)}`),
    ];
    const csv = `\uFEFF${lines.join("\r\n")}\r\n`;
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="prediction-points-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Failed to export points." },
      { status: 500 },
    );
  }
}
