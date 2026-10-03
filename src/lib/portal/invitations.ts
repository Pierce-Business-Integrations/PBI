import "server-only";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { portalDb } from "./db";
import { isAdmin } from "./access";
import { addMembership } from "./repository";
import type { PortalActor } from "./auth";

export async function connectClient(
  actor: PortalActor,
  organizationId: string,
  email: string,
  invite: boolean,
) {
  if (actor.simulated || !(await isAdmin(actor.userId)))
    throw new Error("Owner account access required");
  email = z.email().max(254).parse(email.trim()).toLowerCase();
  const db = await portalDb();
  if (db.dialect !== "postgres")
    throw new Error("Client access must be configured first");
  if (
    !(
      await db.execute({
        sql: "SELECT 1 FROM organizations WHERE id=?",
        args: [organizationId],
      })
    ).rows.length
  )
    throw new Error("Organization not found");
  const existing = (
    await db.execute({
      sql: "SELECT id FROM auth.users WHERE lower(email)=?",
      args: [email],
    })
  ).rows[0];
  let userId = existing ? String(existing.id) : "";
  let invitationUrl: string | undefined;
  if (invite) {
    if (userId && (await isAdmin(userId)))
      throw new Error("An owner account cannot be assigned as a client");
    const { data, error } = await supabaseAdmin().auth.admin.generateLink({
      type: "invite",
      email,
    });
    if (error || !data.user || !data.properties?.hashed_token)
      throw new Error(
        "Unable to create an invitation. Existing clients can sign in with their email.",
      );
    userId = data.user.id;
    invitationUrl = `https://client.piercebusinessintegrations.com/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=invite`;
  }
  if (!userId)
    throw new Error(
      "No client identity exists for this email. Create an invitation first.",
    );
  await addMembership(actor, organizationId, userId);
  // The owner shares this one-time URL deliberately. This function sends no email.
  return { ok: true, invitationUrl };
}
