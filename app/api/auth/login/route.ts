import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  findUserByUsername,
  isUsernameConstraintError,
  isUsernameTaken,
  normalizeUsername,
} from "@/lib/appUsers";
import { getSessionCookieName, signSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type LoginBody = { username?: string; email?: string; password?: string };

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as LoginBody | null;
  const rawUsername = body?.username?.trim() ?? "";
  const rawEmail = body?.email?.trim().toLowerCase() ?? "";
  const username = rawUsername ? normalizeUsername(rawUsername) : "";
  const email = rawEmail;
  const password = body?.password ?? "";

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
  if (!password || password.length < 6) {
    return badRequest("Password must be at least 6 characters.");
  }

  const supabase = getSupabaseServerClient();

  let existing: {
    id: string;
    email: string | null;
    username: string | null;
    password_hash: string;
    is_admin: boolean | null;
    favorite_team: string | null;
  } | null = null;

  if (hasEmail) {
    const { data, error } = await supabase
      .from("app_users")
      .select("id,email,username,password_hash,is_admin,favorite_team")
      .eq("email", email)
      .maybeSingle();
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    existing = data;
  }

  if (!existing && hasUsername) {
    try {
      existing = await findUserByUsername(supabase, username);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to look up user.";
      return NextResponse.json({ ok: false, message }, { status: 500 });
    }
  }

  let userId: string | null = null;
  let isAdmin = false;
  let favoriteTeam: string | null = null;
  let resolvedEmail: string | null = hasEmail ? email : null;
  let resolvedUsername: string | null = hasUsername ? username : null;

  if (!existing) {
    if (hasUsername) {
      try {
        if (await isUsernameTaken(supabase, username)) {
          return badRequest("Username is already taken.");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to check username.";
        return NextResponse.json({ ok: false, message }, { status: 500 });
      }
    }

    if (hasEmail) {
      const { data: emailTaken, error: emailErr } = await supabase
        .from("app_users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (emailErr) {
        return NextResponse.json({ ok: false, message: emailErr.message }, { status: 500 });
      }
      if (emailTaken) return badRequest("Email is already registered.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { data: created, error: createErr } = await supabase
      .from("app_users")
      .insert({
        email: hasEmail ? email : null,
        username: hasUsername ? username : null,
        password_hash: passwordHash,
      })
      .select("id,email,username,is_admin,favorite_team")
      .single();

    if (createErr) {
      if (isUsernameConstraintError(createErr.message)) {
        return badRequest("Username is already taken.");
      }
      return NextResponse.json({ ok: false, message: createErr.message }, { status: 500 });
    }

    userId = created.id;
    isAdmin = created.is_admin ?? false;
    favoriteTeam = created.favorite_team ?? null;
    resolvedEmail = created.email ?? null;
    resolvedUsername = created.username ?? null;
  } else {
    const ok = await bcrypt.compare(password, existing.password_hash);
    if (!ok) {
      return NextResponse.json(
        { ok: false, message: "Invalid username, email, or password." },
        { status: 401 },
      );
    }

    userId = existing.id;
    isAdmin = existing.is_admin ?? false;
    favoriteTeam = existing.favorite_team ?? null;
    resolvedEmail = existing.email ?? null;
    resolvedUsername = existing.username ?? null;

    const updates: { username?: string; email?: string } = {};

    if (hasUsername && !existing.username) {
      try {
        if (await isUsernameTaken(supabase, username, existing.id)) {
          return badRequest("Username is already taken.");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to check username.";
        return NextResponse.json({ ok: false, message }, { status: 500 });
      }
      updates.username = username;
      resolvedUsername = username;
    }

    if (hasEmail && !existing.email) {
      const { data: emailTaken, error: emailErr } = await supabase
        .from("app_users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (emailErr) {
        return NextResponse.json({ ok: false, message: emailErr.message }, { status: 500 });
      }
      if (emailTaken && emailTaken.id !== existing.id) {
        return badRequest("Email is already registered.");
      }
      updates.email = email;
      resolvedEmail = email;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabase
        .from("app_users")
        .update(updates)
        .eq("id", existing.id);
      if (updateErr) {
        if (isUsernameConstraintError(updateErr.message)) {
          return badRequest("Username is already taken.");
        }
        return NextResponse.json({ ok: false, message: updateErr.message }, { status: 500 });
      }
    }
  }

  if (!userId) {
    return NextResponse.json({ ok: false, message: "Failed to sign in." }, { status: 500 });
  }

  const sessionEmail = resolvedEmail ?? resolvedUsername ?? userId;
  const token = await signSession({ id: userId, email: sessionEmail });
  (await cookies()).set({
    name: getSessionCookieName(),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: userId,
      email: resolvedEmail,
      username: resolvedUsername,
      isAdmin,
      favoriteTeam,
    },
  });
}
