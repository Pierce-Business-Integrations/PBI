import { createClient } from "@libsql/client";
import { randomUUID } from "node:crypto";

async function main() {
  const url = process.env.PORTAL_DATABASE_URL;
  const userId = process.env.PORTAL_ADMIN_USER_ID;
  if (!url || !userId?.startsWith("user_"))
    throw new Error(
      "Set PORTAL_DATABASE_URL and a verified Clerk PORTAL_ADMIN_USER_ID",
    );
  const db = createClient({
    url,
    authToken: process.env.PORTAL_DATABASE_AUTH_TOKEN,
  });
  const at = new Date().toISOString();
  const org = randomUUID();
  await db.execute(
    `CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, demo INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`,
  );
  await db.execute(
    `CREATE TABLE IF NOT EXISTS memberships (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), user_id TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','client')), created_at TEXT NOT NULL, UNIQUE(organization_id,user_id))`,
  );
  const existing = (
    await db.execute({
      sql: "SELECT 1 FROM memberships WHERE user_id=? AND role='admin'",
      args: [userId],
    })
  ).rows[0];
  if (existing) console.log("Owner membership already exists");
  else {
    await db.batch(
      [
        {
          sql: "INSERT INTO organizations VALUES (?,?,?,?)",
          args: [org, "PBI portal administration", 0, at],
        },
        {
          sql: "INSERT INTO memberships VALUES (?,?,?,?,?)",
          args: [randomUUID(), org, userId, "admin", at],
        },
      ],
      "write",
    );
    console.log("Owner membership created");
  }
  db.close();
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
