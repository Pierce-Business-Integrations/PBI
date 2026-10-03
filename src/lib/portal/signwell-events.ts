import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
export const signWellEventSchema = z
  .object({
    event: z
      .object({
        type: z.string().min(1).max(80),
        time: z.number().int().positive(),
        hash: z.string().regex(/^[a-f0-9]{64}$/),
        related_signer: z
          .object({ email: z.string() })
          .passthrough()
          .optional(),
      })
      .passthrough(),
    data: z
      .object({ object: z.object({ id: z.string().uuid() }).passthrough() })
      .passthrough(),
  })
  .passthrough();
export type SignWellEvent = z.infer<typeof signWellEventSchema>;

export function verifySignWellEvent(
  payload: unknown,
  webhookId: string | undefined,
  currentSeconds = Date.now() / 1000,
) {
  const parsed = signWellEventSchema.safeParse(payload);
  if (!parsed.success || !webhookId) return false;
  const { event } = parsed.data;
  if (Math.abs(currentSeconds - event.time) > 300) return false;
  const calculated = createHmac("sha256", webhookId)
    .update(`${event.type}@${event.time}`)
    .digest();
  return timingSafeEqual(calculated, Buffer.from(event.hash, "hex"));
}
