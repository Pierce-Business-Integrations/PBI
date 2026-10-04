import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mock, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";

test("hosted repository uses Postgres transactions and private storage without crossing client boundaries", async () => {
  // Real PostgreSQL SQL execution, fake transport/Storage. No hosted account or network is used.
  const engine = new PGlite();
  await engine.exec(
    `CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text); CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE TABLE storage.objects(id text PRIMARY KEY,bucket_id text);`,
  );
  await engine.exec(
    await readFile("supabase/migrations/202610020001_portal.sql", "utf8"),
  );
  process.env.SUPABASE_DB_URL =
    "postgresql://test:test@database.invalid:6543/postgres";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://storage.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
  process.env.SUPABASE_SECRET_KEY = "test-server-key";
  const connectionMock = mock.method(Pool.prototype, "connect", async () => ({
    async query(statement: string | { text: string; values: unknown[] }) {
      const result = await engine.query(
        typeof statement === "string" ? statement : statement.text,
        typeof statement === "string" ? [] : statement.values,
      );
      return { ...result, rowCount: result.affectedRows ?? result.rows.length };
    },
    release() {},
  }));
  const objects = new Map<string, Uint8Array>();
  const storageMock = mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request, options?: RequestInit) => {
      const url = String(input);
      assert.ok(
        url.startsWith("https://storage.invalid/storage/v1/object/"),
        "No provider/network requests allowed",
      );
      assert.ok(
        !url.includes("/public/"),
        "Portal must never use public Storage URLs",
      );
      const path = decodeURIComponent(
        url.replace(/^.*\/object\/(authenticated\/)?portal-documents\//, ""),
      );
      if (options?.method === "POST") {
        assert.ok(options.body instanceof Uint8Array);
        assert.ok(!objects.has(path));
        objects.set(path, new Uint8Array(options.body));
        return Response.json({ Key: path });
      }
      if (options?.method === "DELETE") {
        for (const key of JSON.parse(String(options.body)).prefixes)
          objects.delete(key);
        return Response.json([]);
      }
      const bytes = objects.get(path);
      return bytes
        ? new Response(Buffer.from(bytes))
        : new Response("missing", { status: 404 });
    },
  );
  const { portalDb, id, now } = await import("../../src/lib/portal/db");
  const {
    createProject,
    createDocument,
    getProjectBundle,
    getInvoiceBundle,
    getPrivateFile,
    saveStagePlan,
    voidInvoice,
  } = await import("../../src/lib/portal/repository");
  const db = await portalDb();
  const owner = {
    userId: "34732c83-b683-4f14-96bd-573963800001",
    simulated: false,
  };
  const clientA = {
    userId: "34732c83-b683-4f14-96bd-573963800002",
    simulated: false,
  };
  const clientB = {
    userId: "34732c83-b683-4f14-96bd-573963800003",
    simulated: false,
  };
  try {
    assert.equal(db.dialect, "postgres");
    for (const actor of [owner, clientA, clientB])
      await engine.query("INSERT INTO auth.users VALUES ($1,$2)", [
        actor.userId,
        `${actor.userId}@example.test`,
      ]);
    const ownerOrg = id();
    await db.execute({
      sql: "INSERT INTO organizations VALUES (?,?,?,?)",
      args: [ownerOrg, "Owner", 1, now()],
    });
    await db.execute({
      sql: "INSERT INTO memberships VALUES (?,?,?,?,?)",
      args: [id(), ownerOrg, owner.userId, "admin", now()],
    });
    const projectId = await createProject(
      owner,
      JSON.parse(
        await readFile("docs/client-portal/example-project.json", "utf8"),
      ),
    );
    const project = (await getProjectBundle(projectId, owner))!;
    await db.execute({
      sql: "INSERT INTO memberships VALUES (?,?,?,?,?)",
      args: [
        id(),
        project.project.organization_id,
        clientA.userId,
        "client",
        now(),
      ],
    });
    const stageId = id();
    await saveStagePlan(owner, projectId, {
      version: 1,
      stages: [
        {
          id: stageId,
          title: "Discovery",
          description: "Review the workflow",
          deliverables: ["Priorities"],
          status: "in_progress",
        },
      ],
    });
    await assert.rejects(
      () => saveStagePlan(owner, projectId, { version: 1, stages: [] }),
      /stage plan changed/,
    );
    const { invoiceId, documentId } = await createDocument(
      owner,
      projectId,
      "invoice",
      { amountCents: 50000, due: "2026-10-09", stageId },
    );
    const fileId = String(
      (await getInvoiceBundle(owner, invoiceId!))!.invoice.file_id,
    );
    const stored = (
      await db.execute({
        sql: "SELECT content,storage_path FROM private_files WHERE id=?",
        args: [fileId],
      })
    ).rows[0];
    assert.equal(stored.content, null);
    assert.ok(stored.storage_path);
    assert.equal(objects.size, 1);
    assert.equal(
      await getPrivateFile(clientA, fileId),
      null,
      "Drafts stay private",
    );
    await db.execute({
      sql: "UPDATE documents SET status='approved' WHERE id=?",
      args: [documentId],
    });
    assert.equal(
      (await getProjectBundle(projectId, clientA))!.invoices[0].due,
      "2026-10-09",
    );
    assert.equal(
      (await getInvoiceBundle(clientA, invoiceId!))!.invoice.stage_title,
      "Discovery",
    );
    const file = (await getPrivateFile(clientA, fileId))!;
    assert.equal(Buffer.from(file.content.subarray(0, 5)).toString(), "%PDF-");
    assert.equal(await getProjectBundle(projectId, clientB), null);
    assert.equal(await getInvoiceBundle(clientB, invoiceId!), null);
    assert.equal(await getPrivateFile(clientB, fileId), null);
    await assert.rejects(
      () => voidInvoice(clientA, invoiceId!),
      /Admin access/,
    );
    await voidInvoice(owner, invoiceId!);
    assert.equal(
      (await getInvoiceBundle(clientA, invoiceId!))!.invoice.status,
      "voided",
    );
    assert.ok(
      await getPrivateFile(clientA, fileId),
      "Voiding preserves the original archived PDF",
    );
    objects.set(String(stored.storage_path), new Uint8Array([1, 2, 3]));
    await assert.rejects(() => getPrivateFile(clientA, fileId), /integrity/);
  } finally {
    connectionMock.mock.restore();
    storageMock.mock.restore();
    db.close();
    await engine.close();
  }
});
