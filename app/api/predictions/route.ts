import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySession } from "@/lib/auth";
import { getPredictionWindowState, kickoffMsFromFixtureRow } from "@/lib/kickoff";
import { isKnockoutStage } from "@/lib/teams";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

async function requireUser() {
  const jar = await cookies();
  const token = jar.get(getSessionCookieName())?.value;
  if (!token) return null;
  try {
    const user = await verifySession(token);
    try {
      const supabase = getSupabaseServerClient();
      const { data } = await supabase.from("app_users").select("id").eq("id", user.id).maybeSingle();
      if (!data) {
        jar.set({
          name: getSessionCookieName(),
          value: "",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 0,
        });
        return null;
      }
    } catch {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

function normalizeSide(raw: unknown) {
  if (raw === "home" || raw === "away") return raw;
  return null;
}

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const fixtureId = url.searchParams.get("fixtureId");
  if (!fixtureId) return NextResponse.json({ ok: false, message: "Missing fixtureId" }, { status: 400 });

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Server is not configured." },
      { status: 500 },
    );
  }
  const { data, error } = await supabase
    .from("predictions")
    .select("winner,home_score,away_score,et_winner,pen_winner,updated_at")
    .eq("user_id", user.id)
    .eq("fixture_id", fixtureId)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, prediction: data ?? null });
}

export async function PUT(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        fixtureId?: string;
        winner?: "home" | "away" | "draw";
        homeScore?: number;
        awayScore?: number;
        etWinner?: "home" | "away" | null;
        penWinner?: "home" | "away" | null;
      }
    | null;

  const fixtureId = body?.fixtureId;
  const winner = body?.winner;
  const homeScore = body?.homeScore;
  const awayScore = body?.awayScore;
  const etWinner = normalizeSide(body?.etWinner);
  const penWinner = normalizeSide(body?.penWinner);

  if (!fixtureId) return NextResponse.json({ ok: false, message: "Missing fixtureId" }, { status: 400 });
  if (winner !== "home" && winner !== "away" && winner !== "draw")
    return NextResponse.json({ ok: false, message: "Invalid winner" }, { status: 400 });
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore) || homeScore! < 0 || awayScore! < 0)
    return NextResponse.json({ ok: false, message: "Invalid score" }, { status: 400 });
  if (body?.etWinner !== undefined && body.etWinner !== null && etWinner === null) {
    return NextResponse.json({ ok: false, message: "Invalid extra time winner." }, { status: 400 });
  }
  if (body?.penWinner !== undefined && body.penWinner !== null && penWinner === null) {
    return NextResponse.json({ ok: false, message: "Invalid penalty winner." }, { status: 400 });
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

  const { data: fixture, error: fixtureErr } = await supabase
    .from("fixtures")
    .select("status,date_label,time,city,kickoff_at,home,away,stage")
    .eq("id", fixtureId)
    .maybeSingle();

  if (fixtureErr) return NextResponse.json({ ok: false, message: fixtureErr.message }, { status: 500 });
  if (!fixture) return NextResponse.json({ ok: false, message: "Fixture not found." }, { status: 404 });
  if (fixture.status !== "pending") {
    return NextResponse.json({ ok: false, message: "Predictions are closed for this match." }, { status: 403 });
  }

  const kickoffMs = fixture.kickoff_at
    ? new Date(fixture.kickoff_at).getTime()
    : kickoffMsFromFixtureRow(fixture);
  const window = getPredictionWindowState(kickoffMs);
  if (!window.open) {
    return NextResponse.json(
      { ok: false, message: window.reason ?? "Predictions are not open for this match." },
      { status: 403 },
    );
  }

  const isKnockout = isKnockoutStage(fixture.stage);
  const predictedDraw90 = Math.floor(homeScore!) === Math.floor(awayScore!);

  let storedEtWinner: "home" | "away" | null = null;
  let storedPenWinner: "home" | "away" | null = null;

  if (isKnockout && predictedDraw90) {
    storedEtWinner = etWinner;
    storedPenWinner = penWinner;
  } else if (etWinner || penWinner) {
    return NextResponse.json(
      { ok: false, message: "Extra time and penalty picks are only allowed for a 90-minute draw in knockout matches." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      fixture_id: fixtureId,
      winner,
      home_score: Math.floor(homeScore!),
      away_score: Math.floor(awayScore!),
      et_winner: storedEtWinner,
      pen_winner: storedPenWinner,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,fixture_id" },
  );

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const fixtureId = url.searchParams.get("fixtureId");
  if (!fixtureId) return NextResponse.json({ ok: false, message: "Missing fixtureId" }, { status: 400 });

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Server is not configured." },
      { status: 500 },
    );
  }
  const { error } = await supabase
    .from("predictions")
    .delete()
    .eq("user_id", user.id)
    .eq("fixture_id", fixtureId);

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
