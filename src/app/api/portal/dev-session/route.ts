import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cookieName, signDevActor } from "@/lib/portal/auth";
import { createProject, listProjects } from "@/lib/portal/repository";
import { id, now, portalDb } from "@/lib/portal/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    !["localhost", "127.0.0.1"].includes(hostname)
  )
    return NextResponse.json({ error: "Unavailable" }, { status: 404 });
  const { actor } = await request.json();
  let signed: string;
  try {
    signed = signDevActor(actor);
  } catch {
    return NextResponse.json(
      { error: "Invalid demo identity" },
      { status: 400 },
    );
  }
  if (actor === "dev-admin") {
    const admin = { userId: actor, simulated: true };
    const db = await portalDb();
    const existingAdmin = (
      await db.execute({
        sql: "SELECT 1 FROM memberships WHERE user_id=? AND role='admin' LIMIT 1",
        args: [actor],
      })
    ).rows[0];
    if (!existingAdmin) {
      const bootstrapOrg = id();
      await db.batch(
        [
          {
            sql: "INSERT INTO organizations VALUES (?,?,?,?)",
            args: [bootstrapOrg, "PBI portal demo administration", 1, now()],
          },
          {
            sql: "INSERT INTO memberships VALUES (?,?,?,?,?)",
            args: [id(), bootstrapOrg, actor, "admin", now()],
          },
        ],
        "write",
      );
    }
    if ((await listProjects(admin)).length === 0) {
      const example = JSON.parse(
        await readFile(
          join(process.cwd(), "docs", "client-portal", "example-project.json"),
          "utf8",
        ),
      );
      const first = await createProject(admin, example);
      const second = await createProject(admin, {
        ...example,
        organizationName: "Example Client B (demo)",
        projectName: "Second isolated example (demo)",
        contactName: "Demo Client B",
        contactEmail: "client-b@example.test",
        authorizedSigners: [
          {
            name: "Demo Client B",
            email: "client-b@example.test",
            title: "Owner",
            order: 1,
          },
        ],
      });
      for (const [projectId, userId] of [
        [first, "dev-client-a"],
        [second, "dev-client-b"],
      ]) {
        const row = (
          await db.execute({
            sql: "SELECT organization_id FROM projects WHERE id=?",
            args: [projectId],
          })
        ).rows[0];
        await db.execute({
          sql: "INSERT INTO memberships VALUES (?,?,?,?,?)",
          args: [id(), String(row.organization_id), userId, "client", now()],
        });
      }
    }
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, signed, {
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
