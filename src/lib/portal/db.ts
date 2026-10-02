import "server-only";
import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

let client: Client | undefined;
let initialized: Promise<Client> | undefined;

const statements = [
  `CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, demo INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS memberships (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), user_id TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','client')), created_at TEXT NOT NULL, UNIQUE(organization_id,user_id))`,
  `CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), name TEXT NOT NULL, details_json TEXT NOT NULL, draft_version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS private_files (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), project_id TEXT NOT NULL REFERENCES projects(id), mime_type TEXT NOT NULL, filename TEXT NOT NULL, sha256 TEXT NOT NULL, content BLOB NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), project_id TEXT NOT NULL REFERENCES projects(id), kind TEXT NOT NULL CHECK(kind IN ('proposal','agreement','invoice')), revision INTEGER NOT NULL, template_version TEXT NOT NULL, source_json TEXT NOT NULL, file_id TEXT NOT NULL REFERENCES private_files(id), status TEXT NOT NULL CHECK(status IN ('draft','approved','signing','completed','superseded','voided')), created_at TEXT NOT NULL, UNIQUE(project_id,kind,revision))`,
  `CREATE TABLE IF NOT EXISTS sign_requests (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), project_id TEXT NOT NULL REFERENCES projects(id), document_id TEXT NOT NULL UNIQUE REFERENCES documents(id), provider TEXT NOT NULL, provider_id TEXT UNIQUE, status TEXT NOT NULL, recipients_json TEXT NOT NULL, fields_json TEXT NOT NULL, completed_file_id TEXT REFERENCES private_files(id), audit_file_id TEXT REFERENCES private_files(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), project_id TEXT NOT NULL REFERENCES projects(id), document_id TEXT NOT NULL UNIQUE REFERENCES documents(id), revision INTEGER NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents > 0), currency TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('open','processing','paid','failed','partially_refunded','refunded','voided')), stripe_session_id TEXT UNIQUE, stripe_payment_intent_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, simulation_status TEXT)`,
  `CREATE TABLE IF NOT EXISTS provider_events (id TEXT PRIMARY KEY, provider TEXT NOT NULL, event_id TEXT NOT NULL, payload_json TEXT NOT NULL, received_at TEXT NOT NULL, UNIQUE(provider,event_id))`,
  `CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, organization_id TEXT, project_id TEXT, actor_id TEXT NOT NULL, action TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id)`,
];

export async function portalDb(): Promise<Client> {
  if (!initialized)
    initialized = (async () => {
      if (!client) {
        const url = process.env.PORTAL_DATABASE_URL;
        if (!url && process.env.NODE_ENV === "production")
          throw new Error("PORTAL_DATABASE_URL is required in beta/production");
        if (!url) mkdirSync(join(process.cwd(), ".data"), { recursive: true });
        client = createClient({
          url: url || `file:${join(process.cwd(), ".data", "portal.sqlite")}`,
          authToken: process.env.PORTAL_DATABASE_AUTH_TOKEN,
        });
      }
      for (const sql of statements) await client.execute(sql);
      const invoiceColumns = (
        await client.execute("PRAGMA table_info(invoices)")
      ).rows;
      if (!invoiceColumns.some((row) => row.name === "simulation_status"))
        await client.execute(
          "ALTER TABLE invoices ADD COLUMN simulation_status TEXT",
        );
      return client;
    })();
  return initialized;
}

export function now() {
  return new Date().toISOString();
}
export function id() {
  return crypto.randomUUID();
}

export async function audit(
  organizationId: string | null,
  projectId: string | null,
  actorId: string,
  action: string,
  details: unknown = {},
) {
  const db = await portalDb();
  await db.execute({
    sql: "INSERT INTO audit_events VALUES (?,?,?,?,?,?,?)",
    args: [
      id(),
      organizationId,
      projectId,
      actorId,
      action,
      JSON.stringify(details),
      now(),
    ],
  });
}
