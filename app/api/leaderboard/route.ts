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

  const { data, error } = await supabase
    .from("leaderboard")
    .select("email,predicted,correct,incorrect,draw,points")
    .limit(200);

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, rows: data ?? [] });
}

