import { NextResponse } from "next/server";
import { processPredictionWindowClosures } from "@/lib/predictionClose";
import { sendDemoPredictionWindowClosedEmail } from "@/lib/resend";

function authorizeCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";

  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  if (url.searchParams.get("demo") === "1") {
    try {
      const sentTo = await sendDemoPredictionWindowClosedEmail();
      return NextResponse.json({ ok: true, demo: true, sentTo });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Demo email failed";
      console.error("[cron/prediction-close] demo", error);
      return NextResponse.json({ ok: false, message }, { status: 500 });
    }
  }

  try {
    const result = await processPredictionWindowClosures();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron failed";
    console.error("[cron/prediction-close]", error);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
