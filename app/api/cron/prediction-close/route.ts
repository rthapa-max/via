import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const at = new Date().toISOString();

  console.log("[cron/prediction-close]", {
    at,
    ok: true,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    userAgent: req.headers.get("user-agent"),
    emailSent: false,
  });

  return NextResponse.json({
    ok: true,
    debug: true,
    message: "Cron hit logged; no email sent.",
    at,
  });
}
