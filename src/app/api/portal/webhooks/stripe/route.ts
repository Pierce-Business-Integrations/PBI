import { NextRequest, NextResponse } from "next/server";
import { applyStripeEvent } from "@/lib/portal/payments";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const result = await applyStripeEvent(
      await request.text(),
      request.headers.get("stripe-signature"),
    );
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: "Invalid or unprocessed Stripe event" },
      { status: 400 },
    );
  }
}
