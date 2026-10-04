import { z } from "zod";
import { portalDb, id, now } from "../src/lib/portal/db";
import { supabaseAdmin } from "../src/lib/supabase/admin";
async function main() {
  const userId = z.uuid().parse(process.env.PORTAL_ADMIN_USER_ID);
  if (!process.env.SUPABASE_DB_URL)
    throw new Error("Set the Supabase database connection first");
  const { data, error } = await supabaseAdmin().auth.admin.getUserById(userId);
  if (error || !data.user?.email_confirmed_at)
    throw new Error("Owner must be an existing, verified Supabase user");
  const db = await portalDb();
  try {
    if (
      (
        await db.execute({
          sql: "SELECT 1 FROM memberships WHERE user_id=? AND role='admin'",
          args: [userId],
        })
      ).rows.length
    ) {
      console.log("Owner membership already exists");
      return;
    }
    const organizationId = id();
    await db.batch(
      [
        {
          sql: "INSERT INTO organizations VALUES (?,?,?,?)",
          args: [organizationId, "PBI portal administration", 0, now()],
        },
        {
          sql: "INSERT INTO memberships VALUES (?,?,?,?,?)",
          args: [id(), organizationId, userId, "admin", now()],
        },
      ],
      "write",
    );
    console.log("Owner membership created");
  } finally {
    db.close();
  }
}
main().catch(() => {
  console.error(
    "Owner bootstrap failed. Check the configured verified Supabase user and applied migration.",
  );
  process.exitCode = 1;
});
