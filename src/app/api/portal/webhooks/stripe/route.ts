import { after, NextRequest, NextResponse } from "next/server";
import {
  acceptStripeEvent,
  InvalidStripeEvent,
  processStripeEvent,
} from "@/lib/portal/payments";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  let eventId: string;
  try {
    eventId = await acceptStripeEvent(
      await request.text(),
      request.headers.get("stripe-signature"),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof InvalidStripeEvent
            ? "Invalid Stripe event"
            : "Payment event could not be saved. Retry required.",
      },
      { status: error instanceof InvalidStripeEvent ? 400 : 503 },
    );
  }
  after(async () => {
    try {
      await processStripeEvent(eventId);
    } catch {
      console.error("Stripe event queued for reconciliation");
    }
  });
  return NextResponse.json({ received: true });
}
