import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        fixtureId?: string;
        status?: "scheduled" | "pending";
        complete?: boolean;
        homeScore?: number | null;
        awayScore?: number | null;
      }
    | null;

  const fixtureId = body?.fixtureId;
  if (!fixtureId) return NextResponse.json({ ok: false, message: "Missing fixtureId" }, { status: 400 });

  const supabase = getSupabaseServerClient();

  if (body?.complete) {
    const homeScore = body.homeScore;
    const awayScore = body.awayScore;
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore) || (homeScore ?? 0) < 0 || (awayScore ?? 0) < 0) {
      return NextResponse.json({ ok: false, message: "Invalid score" }, { status: 400 });
    }

    const { error } = await supabase
      .from("fixtures")
      .update({
        status: "finished",
        result_status: "finished",
        result_home_score: Math.floor(homeScore as number),
        result_away_score: Math.floor(awayScore as number),
        result_updated_at: new Date().toISOString(),
      })
      .eq("id", fixtureId);

    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const status = body?.status;
  if (status !== "scheduled" && status !== "pending") {
    return NextResponse.json({ ok: false, message: "Invalid status" }, { status: 400 });
  }

  const { data: fixture, error: fetchErr } = await supabase
    .from("fixtures")
    .select("status")
    .eq("id", fixtureId)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ ok: false, message: fetchErr.message }, { status: 500 });
  if (!fixture) return NextResponse.json({ ok: false, message: "Fixture not found." }, { status: 404 });
  if (fixture.status === "finished") {
    return NextResponse.json({ ok: false, message: "Cannot change status of a finished match." }, { status: 400 });
  }

  const { error } = await supabase
    .from("fixtures")
    .update({
      status,
      result_status: "scheduled",
    })
    .eq("id", fixtureId);

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
