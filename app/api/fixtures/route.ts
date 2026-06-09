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
    .from("fixtures")
    .select(
      "id,date_label,time,home,away,stage,group,stadium,city,status,kickoff_at,result_home_score,result_away_score,result_status",
    )
    .order("date_label", { ascending: true })
    .order("time", { ascending: true });

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, fixtures: data ?? [] });
}

