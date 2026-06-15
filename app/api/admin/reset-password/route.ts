import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { findUserByUsername, normalizeUsername } from "@/lib/appUsers";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type ResetPasswordBody = {
  username?: string;
  email?: string;
  newPassword?: string;
};

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as ResetPasswordBody | null;
  const rawUsername = body?.username?.trim() ?? "";
  const rawEmail = body?.email?.trim().toLowerCase() ?? "";
  const username = rawUsername ? normalizeUsername(rawUsername) : "";
  const email = rawEmail;
  const newPassword = body?.newPassword ?? "";

  const hasUsername = username.length > 0;
  const hasEmail = email.length > 0 && email.includes("@");

  if (!hasUsername && !hasEmail) {
    return badRequest("Enter a username or email.");
  }
  if (hasUsername && !USERNAME_RE.test(username)) {
    return badRequest("Username must be 3-24 characters (letters, numbers, underscore).");
  }
  if (rawEmail.length > 0 && !hasEmail) {
    return badRequest("Enter a valid email.");
  }
  if (!newPassword || newPassword.length < 6) {
    return badRequest("New password must be at least 6 characters.");
  }

  const supabase = getSupabaseServerClient();

  let target: { id: string; email: string | null; username: string | null } | null = null;

  if (hasEmail) {
    const { data, error } = await supabase
      .from("app_users")
      .select("id,email,username")
      .eq("email", email)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
    target = data;
  }

  if (!target && hasUsername) {
    try {
      const user = await findUserByUsername(supabase, username);
      if (user) {
        target = { id: user.id, email: user.email, username: user.username };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to look up user.";
      return NextResponse.json({ ok: false, message }, { status: 500 });
    }
  }

  if (!target) {
    return NextResponse.json({ ok: false, message: "User not found." }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { error: updateErr } = await supabase
    .from("app_users")
    .update({ password_hash: passwordHash })
    .eq("id", target.id);

  if (updateErr) {
    return NextResponse.json({ ok: false, message: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: target.id,
      email: target.email,
      username: target.username,
    },
  });
}
