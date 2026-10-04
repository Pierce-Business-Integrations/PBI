import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { recoverStripeCheckouts, retryStripeEvents } from "./payments";
import { retrySignWellEvents } from "./signing";

export function validMaintenanceToken(authorization: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32 || !authorization?.startsWith("Bearer "))
    return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(authorization.slice(7)), digest(secret));
}

export async function reconcilePortalProviders() {
  // Small batches bound scheduled execution. Every operation is idempotent and
  // a durable event/reservation survives interruption for the next invocation.
  const stripe = process.env.STRIPE_SECRET_KEY
    ? {
        checkouts: await recoverStripeCheckouts(1),
        events: await retryStripeEvents(25),
      }
    : { skipped: true };
  const signing =
    process.env.SIGNWELL_API_KEY && process.env.SIGNWELL_WEBHOOK_ID
      ? await retrySignWellEvents(3)
      : { skipped: true };
  return { checkedAt: new Date().toISOString(), stripe, signing };
}
