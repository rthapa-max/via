import { NextResponse } from "next/server";
import { getPredictionNotifyEmails, sendDemoPredictionWindowClosedEmail } from "@/lib/resend";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const at = new Date().toISOString();

  console.log("[cron/prediction-close] hit", {
    at,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    userAgent: req.headers.get("user-agent"),
    notifyEmails: getPredictionNotifyEmails(),
    fakeData: true,
  });

  try {
    const sentTo = await sendDemoPredictionWindowClosedEmail();
    const response = { ok: true, at, fakeData: true, sentTo, emailsSent: 1 };
    console.log("[cron/prediction-close] done", response);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron failed";
    console.error("[cron/prediction-close] error", { at, message, error });
    return NextResponse.json({ ok: false, at, message }, { status: 500 });
  }
}
