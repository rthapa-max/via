import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(getSessionCookieName())?.value;
  if (!token) return NextResponse.json({ user: null });

  try {
    const user = await verifySession(token);
    // Ensure the user still exists in app_users (prevents stale/old cookies causing FK errors).
    try {
      const supabase = getSupabaseServerClient();
      const { data } = await supabase
        .from("app_users")
        .select("id,email,is_admin")
        .eq("id", user.id)
        .maybeSingle();
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
        return NextResponse.json({ user: null });
      }

      return NextResponse.json({ user: { id: user.id, email: user.email, isAdmin: data.is_admin } });
    } catch {
      // If server isn't configured, don't claim user is logged in.
      return NextResponse.json({ user: null });
    }
  } catch {
    return NextResponse.json({ user: null });
  }
}

