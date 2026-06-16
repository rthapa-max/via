import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { findUserByUsername, normalizeUsername } from "@/lib/appUsers";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type DeleteUserBody = {
  username?: string;
  email?: string;
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

  const body = (await req.json().catch(() => null)) as DeleteUserBody | null;
  const rawUsername = body?.username?.trim() ?? "";
  const rawEmail = body?.email?.trim().toLowerCase() ?? "";
  const username = rawUsername ? normalizeUsername(rawUsername) : "";
  const email = rawEmail;

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

  const supabase = getSupabaseServerClient();

  let target: {
    id: string;
    email: string | null;
    username: string | null;
    is_admin: boolean | null;
  } | null = null;

  if (hasEmail) {
    const { data, error } = await supabase
      .from("app_users")
      .select("id,email,username,is_admin")
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
        target = {
          id: user.id,
          email: user.email,
          username: user.username,
          is_admin: user.is_admin,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to look up user.";
      return NextResponse.json({ ok: false, message }, { status: 500 });
    }
  }

  if (!target) {
    return NextResponse.json({ ok: false, message: "User not found." }, { status: 404 });
  }

  if (target.id === admin.id) {
    return badRequest("You cannot delete your own account.");
  }

  if (target.is_admin) {
    return badRequest("Admin accounts cannot be deleted.");
  }

  const { error: deleteErr } = await supabase.from("app_users").delete().eq("id", target.id);

  if (deleteErr) {
    return NextResponse.json({ ok: false, message: deleteErr.message }, { status: 500 });
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
