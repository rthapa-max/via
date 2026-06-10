import { NextResponse } from "next/server";
import { processPredictionWindowClosures } from "@/lib/predictionClose";
import { getPredictionNotifyEmails } from "@/lib/resend";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const at = new Date().toISOString();
  // const demo = url.searchParams.get("demo") === "1";

  console.log("[cron/prediction-close] hit", {
    at,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    userAgent: req.headers.get("user-agent"),
    notifyEmails: getPredictionNotifyEmails(),
    // demo,
  });

  try {

    const result = await processPredictionWindowClosures();
    const response = { ok: true, at, ...result };
    console.log("[cron/prediction-close] done", response);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron failed";
    console.error("[cron/prediction-close] error", { at, message, error });
    return NextResponse.json({ ok: false, at, message }, { status: 500 });
  }
}
