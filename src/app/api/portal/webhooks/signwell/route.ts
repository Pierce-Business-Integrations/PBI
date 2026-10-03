import { after, NextRequest, NextResponse } from "next/server";
import {
  acceptSignWellEvent,
  processSignWellEvent,
} from "@/lib/portal/signing";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  let eventId: string;
  try {
    eventId = await acceptSignWellEvent(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid or unrecognized signing event" },
      { status: 400 },
    );
  }
  // Acknowledge only after durable storage. Failed processing stays in the retry queue.
  after(async () => {
    try {
      await processSignWellEvent(eventId);
    } catch {
      console.error("SignWell event queued for reconciliation");
    }
  });
  return NextResponse.json({ received: true });
}
