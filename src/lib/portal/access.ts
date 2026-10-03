import "server-only";
import { portalDb } from "./db";

export async function hasPortalAccess(userId: string) {
  const db = await portalDb();
  return (
    (
      await db.execute({
        sql: "SELECT 1 FROM memberships WHERE user_id=? LIMIT 1",
        args: [userId],
      })
    ).rows.length > 0
  );
}

export async function isAdmin(userId: string) {
  const db = await portalDb();
  return (
    (
      await db.execute({
        sql: "SELECT 1 FROM memberships WHERE user_id=? AND role='admin' LIMIT 1",
        args: [userId],
      })
    ).rows.length > 0
  );
}

export async function mayAccessOrganization(
  userId: string,
  organizationId: string,
) {
  const db = await portalDb();
  return (
    (
      await db.execute({
        sql: "SELECT 1 FROM memberships WHERE user_id=? AND (organization_id=? OR role='admin') LIMIT 1",
        args: [userId, organizationId],
      })
    ).rows.length > 0
  );
}
