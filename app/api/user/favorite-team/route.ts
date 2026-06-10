import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySession } from "@/lib/auth";
import { collectParticipantTeams, isParticipantTeam } from "@/lib/teams";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

async function requireUser() {
  const jar = await cookies();
  const token = jar.get(getSessionCookieName())?.value;
  if (!token) return null;
  try {
    const user = await verifySession(token);
    const supabase = getSupabaseServerClient();
    const { data } = await supabase.from("app_users").select("id").eq("id", user.id).maybeSingle();
    if (!data) return null;
    return user;
  } catch {
    return null;
  }
}

export async function PUT(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { team?: string | null } | null;
  const team = body?.team?.trim() ?? "";

  if (!team) {
    return NextResponse.json({ ok: false, message: "Pick a team." }, { status: 400 });
  }

  if (!isParticipantTeam(team)) {
    return NextResponse.json({ ok: false, message: "Invalid team." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data: fixtures, error: fixturesErr } = await supabase.from("fixtures").select("home,away");
  if (fixturesErr) {
    return NextResponse.json({ ok: false, message: fixturesErr.message }, { status: 500 });
  }

  const allowed = collectParticipantTeams(fixtures ?? []);
  if (!allowed.includes(team)) {
    return NextResponse.json({ ok: false, message: "Team not in tournament." }, { status: 400 });
  }

  const { error } = await supabase
    .from("app_users")
    .update({ favorite_team: team })
    .eq("id", user.id);

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, favoriteTeam: team });
}
