import { NextResponse } from "next/server";
import { collectParticipantTeams } from "@/lib/teams";
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

  const { data, error } = await supabase.from("fixtures").select("home,away");
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  const teams = collectParticipantTeams(data ?? []);
  return NextResponse.json({ ok: true, teams });
}
