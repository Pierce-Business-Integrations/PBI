import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { authDestination } from "../src/lib/portal/auth-navigation";
import {
  postgresParameters,
  jsonText,
  nullEqual,
} from "../src/lib/portal/database-types";
import { verifySignWellEvent } from "../src/lib/portal/signwell-events";
import { renderPortalDocument } from "../src/lib/portal/documents";
import { parseProjectDetails } from "../src/lib/portal/schema";
import { readSigningFields } from "../src/lib/portal/signing-fields";

test("auth redirects remain within the private workspace", () => {
  assert.equal(
    authDestination("/portal/project?view=progress"),
    "/portal/project?view=progress",
  );
  for (const target of [
    "//evil.test",
    "https://evil.test",
    "/account/../../contact",
    "/account\\evil.test",
    "/portalish",
    "/%2f%2fevil.test",
    "",
  ])
    assert.equal(authDestination(target), "/account");
});
test("SignWell uses its documented hash and rejects forged, old and future events", () => {
  const time = Math.floor(Date.now() / 1000);
  const event = {
    type: "document_completed",
    time,
    hash: createHmac("sha256", "test-webhook")
      .update(`document_completed@${time}`)
      .digest("hex"),
  };
  const payload = {
    event,
    data: { object: { id: "ec4d9f32-9d4d-40f1-8e89-9d1a99033355" } },
  };
  assert.equal(verifySignWellEvent(payload, "test-webhook", time), true);
  assert.equal(verifySignWellEvent(payload, "wrong-key", time), false);
  assert.equal(verifySignWellEvent(payload, "test-webhook", time + 301), false);
  assert.equal(verifySignWellEvent(payload, "test-webhook", time - 301), false);
  assert.equal(
    verifySignWellEvent(
      { ...payload, event: { ...event, type: "document_signed" } },
      "test-webhook",
      time,
    ),
    false,
  );
  assert.equal(
    verifySignWellEvent(
      { ...payload, event: { ...event, hash: "short" } },
      "test-webhook",
      time,
    ),
    false,
  );
});
test("agreement signer coordinates follow wrapped headings and signing order", async () => {
  const source = JSON.parse(
    await readFile("docs/client-portal/example-project.json", "utf8"),
  );
  source.authorizedSigners = [
    {
      name: "Second signer",
      email: "second@example.test",
      title: "Owner",
      order: 2,
    },
    {
      name: "First authorized signer with a long name that wraps across multiple lines",
      email: "first@example.test",
      title: "President",
      order: 1,
    },
  ];
  source.requiresPbiSignature = true;
  const bytes = await renderPortalDocument(
    "agreement",
    parseProjectDetails(source),
    1,
  );
  const fields = await readSigningFields(bytes);
  assert.equal(fields.length, 11);
  assert.deepEqual(
    [...new Set(fields.map((field) => field.recipient_id))],
    ["1", "2", "3"],
  );
  assert.equal(fields.filter((field) => field.type === "signature").length, 3);
  assert.ok(
    fields.find((field) => field.recipient_id === "1")!.y >
      fields.find((field) => field.recipient_id === "2")!.y,
  );
  assert.ok(
    fields
      .filter((field) => field.type === "date")
      .every((field) => field.lock_sign_date),
  );
});
test("Postgres migration enforces private roles and invoice constraints on a real SQL engine", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE TABLE storage.objects(id text PRIMARY KEY,bucket_id text); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; GRANT USAGE ON SCHEMA storage TO anon,authenticated; GRANT ALL ON storage.objects TO anon,authenticated; CREATE POLICY existing_broad_policy ON storage.objects FOR ALL TO anon,authenticated USING(true) WITH CHECK(true);`,
    );
    await db.exec(
      await readFile("supabase/migrations/202610020001_portal.sql", "utf8"),
    );
    await db.exec(
      `INSERT INTO storage.objects VALUES ('private','portal-documents'),('other','public-assets'); SET ROLE authenticated;`,
    );
    assert.deepEqual((await db.query("SELECT id FROM storage.objects")).rows, [
      { id: "other" },
    ]);
    await assert.rejects(
      () => db.query("SELECT * FROM pbi_portal.projects"),
      /permission denied/,
    );
    await assert.rejects(
      () =>
        db.query(
          "INSERT INTO storage.objects VALUES ('intruder','portal-documents')",
        ),
      /row-level security/,
    );
    await db.exec("RESET ROLE; SET search_path TO pbi_portal,pg_catalog;");
    assert.equal(
      postgresParameters(
        "SELECT '?' AS literal,? AS first,'it''s?' AS quoted,? AS second",
      ),
      "SELECT '?' AS literal,$1 AS first,'it''s?' AS quoted,$2 AS second",
    );
    const row = await db.query<{ due: string; match: boolean }>(
      postgresParameters(
        `SELECT ${jsonText("postgres", "source_json", ["invoice", "due"])} AS due,${nullEqual("postgres", "stripe_session_id")} AS match FROM (SELECT ?::text AS source_json,NULL::text AS stripe_session_id) t`,
      ),
      [null, JSON.stringify({ invoice: { due: "2026-10-09" } })],
    );
    assert.equal(row.rows[0].due, "2026-10-09");
    assert.equal(row.rows[0].match, true);
    await db.exec(
      `INSERT INTO organizations VALUES ('org','Example',1,'now'); INSERT INTO auth.users VALUES ('ec4d9f32-9d4d-40f1-8e89-9d1a99033355'); INSERT INTO memberships VALUES ('member','org','ec4d9f32-9d4d-40f1-8e89-9d1a99033355','client','now'); INSERT INTO projects(id,organization_id,name,details_json,created_at,updated_at) VALUES ('project','org','Example','{}','now','now'); INSERT INTO project_stages VALUES ('stage','project',0,'Discovery','Review','[]','in_progress','now',NULL);`,
    );
    await assert.rejects(
      () =>
        db.exec(
          `INSERT INTO project_stages VALUES ('second','project',1,'Build','Build','[]','in_progress','now',NULL)`,
        ),
      /duplicate key/,
    );
    await assert.rejects(
      () =>
        db.exec(
          `INSERT INTO memberships VALUES ('invalid','org','non-uuid','admin','now')`,
        ),
      /uuid/,
    );
    await assert.rejects(
      () =>
        db.exec(
          `INSERT INTO private_files VALUES ('file','org','project','application/pdf','file.pdf','hash',NULL,'now',NULL)`,
        ),
      /check constraint/,
    );
    await db.exec(
      `INSERT INTO private_files VALUES ('file','org','project','application/pdf','file.pdf','hash',NULL,'now','org/project/file.pdf'); INSERT INTO documents VALUES ('doc','org','project','invoice',1,'v3','{}','file','approved','now'); INSERT INTO invoices(id,organization_id,project_id,document_id,revision,amount_cents,currency,status,created_at,updated_at,stage_id) VALUES ('invoice','org','project','doc',1,500,'usd','open','now','now','stage');`,
    );
    const reserved = await db.query(
      postgresParameters(
        `UPDATE invoices SET checkout_attempt=? WHERE id=? AND checkout_attempt IS NULL AND ${nullEqual("postgres", "stripe_session_id")}`,
      ),
      ["attempt", "invoice", null],
    );
    assert.equal(reserved.affectedRows, 1);
    assert.equal(
      (
        await db.query(
          postgresParameters(
            `UPDATE invoices SET checkout_attempt=? WHERE id=? AND checkout_attempt IS NULL`,
          ),
          ["second", "invoice"],
        )
      ).affectedRows,
      0,
    );
  } finally {
    await db.close();
  }
});
