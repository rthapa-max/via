import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { isKnockoutStage } from "@/lib/teams";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

function normalizeSide(raw: unknown) {
  if (raw === "home" || raw === "away") return raw;
  return null;
}

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
        wentToExtraTime?: boolean;
        etWinner?: "home" | "away" | null;
        penWinner?: "home" | "away" | null;
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

    const { data: fixture, error: fetchErr } = await supabase
      .from("fixtures")
      .select("stage")
      .eq("id", fixtureId)
      .maybeSingle();

    if (fetchErr) return NextResponse.json({ ok: false, message: fetchErr.message }, { status: 500 });
    if (!fixture) return NextResponse.json({ ok: false, message: "Fixture not found." }, { status: 404 });

    const isKnockout = isKnockoutStage(fixture.stage);
    const drawAt90 = Math.floor(homeScore as number) === Math.floor(awayScore as number);
    const etWinner = normalizeSide(body.etWinner);
    const penWinner = normalizeSide(body.penWinner);

    if (body.etWinner !== undefined && body.etWinner !== null && etWinner === null) {
      return NextResponse.json({ ok: false, message: "Invalid extra time winner." }, { status: 400 });
    }
    if (body.penWinner !== undefined && body.penWinner !== null && penWinner === null) {
      return NextResponse.json({ ok: false, message: "Invalid penalty winner." }, { status: 400 });
    }

    let resultWentToExtraTime = false;
    let resultEtWinner: "home" | "away" | null = null;
    let resultPenWinner: "home" | "away" | null = null;

    if (isKnockout && drawAt90) {
      if (!etWinner && !penWinner) {
        return NextResponse.json(
          { ok: false, message: "Knockout draw requires an extra time or penalty winner." },
          { status: 400 },
        );
      }
      if (etWinner && penWinner) {
        return NextResponse.json(
          { ok: false, message: "Record either an extra time winner or a penalty winner, not both." },
          { status: 400 },
        );
      }

      resultWentToExtraTime = true;
      resultEtWinner = etWinner;
      resultPenWinner = penWinner;
    } else if (etWinner || penWinner || body.wentToExtraTime) {
      return NextResponse.json(
        { ok: false, message: "Extra time and penalties only apply to knockout draws at 90 minutes." },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("fixtures")
      .update({
        status: "finished",
        result_status: "finished",
        result_home_score: Math.floor(homeScore as number),
        result_away_score: Math.floor(awayScore as number),
        result_went_to_extra_time: resultWentToExtraTime,
        result_et_winner: resultEtWinner,
        result_pen_winner: resultPenWinner,
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
