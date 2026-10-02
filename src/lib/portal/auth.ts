import "server-only";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { portalDb } from "./db";

const cookieName = "pbi_portal_dev_actor";
// This fallback is intentionally only a local simulation, never production authentication.
const devSecret =
  process.env.PORTAL_DEV_SECRET || "pbi-local-development-simulation-only";
const devActors = ["dev-admin", "dev-client-a", "dev-client-b"] as const;
export type PortalActor = { userId: string; simulated: boolean };
export const configuredClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export function signDevActor(actor: string) {
  if (
    process.env.NODE_ENV !== "development" ||
    !devActors.includes(actor as (typeof devActors)[number])
  )
    throw new Error("Development identities are unavailable");
  return `${actor}.${createHmac("sha256", devSecret).update(actor).digest("hex")}`;
}

export async function authenticatedActor(): Promise<PortalActor | null> {
  if (process.env.NODE_ENV === "development" && !configuredClerk) {
    const raw = (await cookies()).get(cookieName)?.value || "";
    const [actor, mac] = raw.split(".");
    if (
      !devActors.includes(actor as (typeof devActors)[number]) ||
      !mac ||
      !/^[a-f0-9]{64}$/.test(mac)
    )
      return null;
    const expected = createHmac("sha256", devSecret).update(actor).digest();
    if (!timingSafeEqual(Buffer.from(mac, "hex"), expected)) return null;
    return { userId: actor, simulated: true };
  }
  if (!configuredClerk) return null;
  const { userId } = await auth();
  return userId ? { userId, simulated: false } : null;
}

export async function hasPortalAccess(userId: string) {
  const db = await portalDb();
  const result = await db.execute({
    sql: "SELECT 1 FROM memberships WHERE user_id=? LIMIT 1",
    args: [userId],
  });
  return result.rows.length > 0;
}

export async function portalActor(): Promise<PortalActor | null> {
  const actor = await authenticatedActor();
  return actor && (await hasPortalAccess(actor.userId)) ? actor : null;
}

export async function requireActor() {
  const actor = await portalActor();
  if (!actor) throw new Error("Authentication required");
  return actor;
}

export async function isAdmin(userId: string) {
  const db = await portalDb();
  const result = await db.execute({
    sql: "SELECT 1 FROM memberships WHERE user_id=? AND role='admin' LIMIT 1",
    args: [userId],
  });
  return result.rows.length > 0;
}

export async function requireAdmin() {
  const actor = await requireActor();
  if (!(await isAdmin(actor.userId))) throw new Error("Admin access required");
  return actor;
}

export async function mayAccessOrganization(
  userId: string,
  organizationId: string,
) {
  const db = await portalDb();
  const result = await db.execute({
    sql: "SELECT 1 FROM memberships WHERE user_id=? AND (organization_id=? OR role='admin') LIMIT 1",
    args: [userId, organizationId],
  });
  return result.rows.length > 0;
}

export async function requireOrganization(organizationId: string) {
  const actor = await requireActor();
  if (!(await mayAccessOrganization(actor.userId, organizationId)))
    throw new Error("Access denied");
  return actor;
}

export async function requireProject(projectId: string) {
  const actor = await requireActor();
  const db = await portalDb();
  const result = await db.execute({
    sql: "SELECT id,organization_id,name,details_json,draft_version FROM projects WHERE id=?",
    args: [projectId],
  });
  const row = result.rows[0];
  if (
    !row ||
    !(await mayAccessOrganization(actor.userId, String(row.organization_id)))
  )
    throw new Error("Project not found");
  return { actor, project: row };
}

export { cookieName };
