import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { collectParticipantTeams, isKnockoutStage, isParticipantTeam } from "@/lib/teams";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

function normalizeTeamName(raw: string | undefined) {
  const name = raw?.trim() ?? "";
  if (!name) return null;
  if (!isParticipantTeam(name)) return null;
  return name;
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        fixtureId?: string;
        home?: string;
        away?: string;
      }
    | null;

  const fixtureId = body?.fixtureId?.trim();
  if (!fixtureId) {
    return NextResponse.json({ ok: false, message: "Missing fixtureId" }, { status: 400 });
  }

  const home = body?.home !== undefined ? normalizeTeamName(body.home) : undefined;
  const away = body?.away !== undefined ? normalizeTeamName(body.away) : undefined;

  if (home === null) {
    return NextResponse.json({ ok: false, message: "Invalid home team name." }, { status: 400 });
  }
  if (away === null) {
    return NextResponse.json({ ok: false, message: "Invalid away team name." }, { status: 400 });
  }
  if (home === undefined && away === undefined) {
    return NextResponse.json({ ok: false, message: "Provide home and/or away team name." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const [{ data: fixture, error: fetchErr }, { data: fixtures, error: fixturesErr }] = await Promise.all([
    supabase.from("fixtures").select("id,stage,home,away").eq("id", fixtureId).maybeSingle(),
    supabase.from("fixtures").select("home,away"),
  ]);

  if (fetchErr) return NextResponse.json({ ok: false, message: fetchErr.message }, { status: 500 });
  if (fixturesErr) return NextResponse.json({ ok: false, message: fixturesErr.message }, { status: 500 });
  if (!fixture) return NextResponse.json({ ok: false, message: "Fixture not found." }, { status: 404 });
  if (!isKnockoutStage(fixture.stage)) {
    return NextResponse.json(
      { ok: false, message: "Team names can only be updated for knockout fixtures." },
      { status: 400 },
    );
  }

  const allowedTeams = new Set(collectParticipantTeams(fixtures ?? []));
  if (home !== undefined && !allowedTeams.has(home)) {
    return NextResponse.json({ ok: false, message: "Home team is not in the tournament." }, { status: 400 });
  }
  if (away !== undefined && !allowedTeams.has(away)) {
    return NextResponse.json({ ok: false, message: "Away team is not in the tournament." }, { status: 400 });
  }

  const patch: { home?: string; away?: string } = {};
  if (home !== undefined) patch.home = home;
  if (away !== undefined) patch.away = away;

  const { error } = await supabase.from("fixtures").update(patch).eq("id", fixtureId);
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    fixture: {
      id: fixtureId,
      home: home ?? fixture.home,
      away: away ?? fixture.away,
    },
  });
}