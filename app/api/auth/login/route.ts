import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, signSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type LoginBody = { email?: string; password?: string };

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as LoginBody | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";

  if (!email || !email.includes("@")) return badRequest("Enter a valid email.");
  if (!password || password.length < 6) return badRequest("Password must be at least 6 characters.");

  const supabase = getSupabaseServerClient();

  // Try find user
  const { data: existing, error: findErr } = await supabase
    .from("app_users")
    .select("id,email,password_hash,is_admin,favorite_team")
    .eq("email", email)
    .maybeSingle();

  if (findErr) return NextResponse.json({ ok: false, message: findErr.message }, { status: 500 });

  let userId: string | null = null;
  let isAdmin = false;
  let favoriteTeam: string | null = null;

  if (!existing) {
    // Create user
    const passwordHash = await bcrypt.hash(password, 10);
    const { data: created, error: createErr } = await supabase
      .from("app_users")
      .insert({ email, password_hash: passwordHash })
      .select("id,email,is_admin,favorite_team")
      .single();

    if (createErr)
      return NextResponse.json({ ok: false, message: createErr.message }, { status: 500 });

    userId = created.id;
    isAdmin = created.is_admin ?? false;
    favoriteTeam = created.favorite_team ?? null;
  } else {
    const ok = await bcrypt.compare(password, existing.password_hash);
    if (!ok) return NextResponse.json({ ok: false, message: "Invalid email or password." }, { status: 401 });
    userId = existing.id;
    isAdmin = existing.is_admin ?? false;
    favoriteTeam = existing.favorite_team ?? null;
  }

  if (!userId) {
    return NextResponse.json({ ok: false, message: "Failed to sign in." }, { status: 500 });
  }

  const token = await signSession({ id: userId, email });
  (await cookies()).set({
    name: getSessionCookieName(),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true, user: { id: userId, email, isAdmin, favoriteTeam } });
}

