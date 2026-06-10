import { NextResponse } from "next/server";

function authorizeCron(req: Request) {
  const url = new URL(req.url);
  if (process.env.NODE_ENV === "development" && url.searchParams.get("demo") === "1") {
    return true;
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";

  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const at = new Date().toISOString();

  if (!authorizeCron(req)) {
    console.log("[cron/prediction-close]", { at, ok: false, reason: "unauthorized", path: url.pathname });
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron/prediction-close]", {
    at,
    ok: true,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    userAgent: req.headers.get("user-agent"),
    // Email disabled for now — debug only.
    emailSent: false,
  });

  return NextResponse.json({
    ok: true,
    debug: true,
    message: "Cron hit logged; no email sent.",
    at,
  });
}
