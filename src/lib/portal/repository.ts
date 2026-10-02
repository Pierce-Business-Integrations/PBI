import "server-only";
import { createHash } from "node:crypto";
import { audit, id, now, portalDb } from "./db";
import {
  renderPortalDocument,
  TEMPLATE_VERSION,
  type DocumentKind,
} from "./documents";
import { parseProjectDetails, type ProjectDetails } from "./schema";
import { isAdmin, mayAccessOrganization, type PortalActor } from "./auth";

export async function listProjects(actor: PortalActor) {
  const db = await portalDb();
  return (
    await db.execute({
      sql: `SELECT DISTINCT p.id,p.organization_id,p.name,o.name AS organization_name,o.demo FROM projects p JOIN organizations o ON o.id=p.organization_id JOIN memberships m ON m.user_id=? AND (m.organization_id=p.organization_id OR m.role='admin') ORDER BY p.updated_at DESC`,
      args: [actor.userId],
    })
  ).rows;
}

export async function getProjectBundle(projectId: string, actor: PortalActor) {
  const db = await portalDb();
  const project = (
    await db.execute({
      sql: "SELECT p.*,o.name AS organization_name,o.demo FROM projects p JOIN organizations o ON o.id=p.organization_id WHERE p.id=?",
      args: [projectId],
    })
  ).rows[0];
  if (
    !project ||
    !(await mayAccessOrganization(
      actor.userId,
      String(project.organization_id),
    ))
  )
    return null;
  const admin = await isAdmin(actor.userId);
  const visible = admin ? "" : " AND status!='draft'";
  const documents = (
    await db.execute({
      sql: `SELECT id,kind,revision,template_version,status,created_at,file_id FROM documents WHERE project_id=?${visible} ORDER BY created_at DESC`,
      args: [projectId],
    })
  ).rows;
  const invoices = (
    await db.execute({
      sql: `SELECT i.id,i.document_id,i.revision,i.amount_cents,i.currency,i.status,i.simulation_status,i.created_at FROM invoices i JOIN documents d ON d.id=i.document_id WHERE i.project_id=?${admin ? "" : " AND d.status!='draft'"} ORDER BY i.created_at DESC`,
      args: [projectId],
    })
  ).rows;
  const signing = (
    await db.execute({
      sql: "SELECT id,document_id,provider,status,completed_file_id,audit_file_id FROM sign_requests WHERE project_id=? ORDER BY created_at DESC",
      args: [projectId],
    })
  ).rows;
  return {
    project,
    details: parseProjectDetails(JSON.parse(String(project.details_json))),
    documents,
    invoices,
    signing,
  };
}

export async function createProject(actor: PortalActor, raw: unknown) {
  if (!(await isAdmin(actor.userId))) throw new Error("Admin access required");
  const details = parseProjectDetails(raw);
  if (!details.demo)
    throw new Error(
      "Only clearly labeled demo projects are enabled during this initial build",
    );
  const db = await portalDb();
  const orgId = id(),
    projectId = id(),
    at = now();
  await db.batch(
    [
      {
        sql: "INSERT INTO organizations VALUES (?,?,?,?)",
        args: [orgId, details.organizationName, details.demo ? 1 : 0, at],
      },
      {
        sql: "INSERT INTO projects VALUES (?,?,?,?,?,?,?)",
        args: [
          projectId,
          orgId,
          details.projectName,
          JSON.stringify(details),
          1,
          at,
          at,
        ],
      },
      {
        sql: "INSERT INTO memberships VALUES (?,?,?,?,?)",
        args: [id(), orgId, actor.userId, "admin", at],
      },
    ],
    "write",
  );
  await audit(orgId, projectId, actor.userId, "project.created", {
    demo: details.demo,
  });
  return projectId;
}

export async function updateProject(
  actor: PortalActor,
  projectId: string,
  raw: unknown,
) {
  if (!(await isAdmin(actor.userId))) throw new Error("Admin access required");
  const details = parseProjectDetails(raw);
  if (!details.demo)
    throw new Error(
      "Only clearly labeled demo projects are enabled during this initial build",
    );
  const db = await portalDb();
  const project = (
    await db.execute({
      sql: "SELECT organization_id,draft_version FROM projects WHERE id=?",
      args: [projectId],
    })
  ).rows[0];
  if (!project) throw new Error("Project not found");
  await db.execute({
    sql: "UPDATE projects SET name=?,details_json=?,draft_version=draft_version+1,updated_at=? WHERE id=?",
    args: [details.projectName, JSON.stringify(details), now(), projectId],
  });
  await audit(
    String(project.organization_id),
    projectId,
    actor.userId,
    "project.draft.updated",
    { priorVersion: Number(project.draft_version) },
  );
}

export async function createDocument(
  actor: PortalActor,
  projectId: string,
  kind: DocumentKind,
  invoice?: { amountCents: number; due: string },
) {
  if (!(await isAdmin(actor.userId))) throw new Error("Admin access required");
  const db = await portalDb();
  const project = (
    await db.execute({
      sql: "SELECT * FROM projects WHERE id=?",
      args: [projectId],
    })
  ).rows[0];
  if (!project) throw new Error("Project not found");
  const details: ProjectDetails = parseProjectDetails(
    JSON.parse(String(project.details_json)),
  );
  if (
    kind === "invoice" &&
    (!invoice ||
      !Number.isInteger(invoice.amountCents) ||
      invoice.amountCents <= 0 ||
      !invoice.due.trim())
  )
    throw new Error("Invoice amount and due date are required");
  if (kind === "agreement") {
    const active = (
      await db.execute({
        sql: "SELECT 1 FROM sign_requests WHERE project_id=? AND status IN ('pending','awaiting_file','cancel_requested','simulated_pending') LIMIT 1",
        args: [projectId],
      })
    ).rows.length;
    if (active)
      throw new Error(
        "Void the active signing request before creating a new agreement revision",
      );
  }
  const previous = (
    await db.execute({
      sql: "SELECT COALESCE(MAX(revision),0) AS revision FROM documents WHERE project_id=? AND kind=?",
      args: [projectId, kind],
    })
  ).rows[0];
  const revision = Number(previous.revision) + 1;
  const invoiceNumber = `${details.demo ? "DEMO" : "PBI"}-${projectId.slice(0, 8).toUpperCase()}-${String(revision).padStart(3, "0")}`;
  const bytes = await renderPortalDocument(
    kind,
    details,
    revision,
    invoice && { ...invoice, number: invoiceNumber },
  );
  const fileId = id(),
    documentId = id(),
    invoiceId = kind === "invoice" ? id() : null,
    at = now();
  const orgId = String(project.organization_id);
  const source = JSON.stringify({
    details,
    invoice: invoice ? { ...invoice, number: invoiceNumber } : null,
  });
  const queries: {
    sql: string;
    args: (string | number | Uint8Array | null)[];
  }[] = [
    {
      sql: "INSERT INTO private_files VALUES (?,?,?,?,?,?,?,?)",
      args: [
        fileId,
        orgId,
        projectId,
        "application/pdf",
        `PBI-${kind}-r${revision}.pdf`,
        createHash("sha256").update(bytes).digest("hex"),
        bytes,
        at,
      ],
    },
    {
      sql: "INSERT INTO documents VALUES (?,?,?,?,?,?,?,?,?,?)",
      args: [
        documentId,
        orgId,
        projectId,
        kind,
        revision,
        TEMPLATE_VERSION,
        source,
        fileId,
        "draft",
        at,
      ],
    },
  ];
  if (invoiceId && invoice)
    queries.push({
      sql: "INSERT INTO invoices (id,organization_id,project_id,document_id,revision,amount_cents,currency,status,stripe_session_id,stripe_payment_intent_id,created_at,updated_at,simulation_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      args: [
        invoiceId,
        orgId,
        projectId,
        documentId,
        revision,
        invoice.amountCents,
        "usd",
        "open",
        null,
        null,
        at,
        at,
        null,
      ],
    });
  await db.batch(queries, "write");
  await audit(orgId, projectId, actor.userId, `${kind}.created`, {
    documentId,
    revision,
    template: TEMPLATE_VERSION,
  });
  return { documentId, invoiceId };
}

export async function getPrivateFileInfo(actor: PortalActor, fileId: string) {
  const db = await portalDb();
  const row = (
    await db.execute({
      sql: "SELECT id,organization_id,project_id,filename,mime_type FROM private_files WHERE id=?",
      args: [fileId],
    })
  ).rows[0];
  if (
    !row ||
    !(await mayAccessOrganization(actor.userId, String(row.organization_id)))
  )
    return null;
  if (!(await isAdmin(actor.userId))) {
    const draft = (
      await db.execute({
        sql: "SELECT 1 FROM documents WHERE file_id=? AND status='draft' LIMIT 1",
        args: [fileId],
      })
    ).rows.length;
    if (draft) return null;
  }
  return row;
}

export async function getPrivateFile(actor: PortalActor, fileId: string) {
  if (!(await getPrivateFileInfo(actor, fileId))) return null;
  const db = await portalDb();
  return (
    await db.execute({
      sql: "SELECT * FROM private_files WHERE id=?",
      args: [fileId],
    })
  ).rows[0];
}

export async function addMembership(
  actor: PortalActor,
  organizationId: string,
  userId: string,
) {
  if (!(await isAdmin(actor.userId))) throw new Error("Admin access required");
  const db = await portalDb();
  const organization = (
    await db.execute({
      sql: "SELECT id FROM organizations WHERE id=?",
      args: [organizationId],
    })
  ).rows[0];
  if (!organization) throw new Error("Organization not found");
  if (userId === actor.userId)
    throw new Error("Owner cannot assign their own account as a client");
  await db.execute({
    sql: "INSERT INTO memberships VALUES (?,?,?,?,?) ON CONFLICT(organization_id,user_id) DO UPDATE SET role='client'",
    args: [id(), organizationId, userId, "client", now()],
  });
  await audit(organizationId, null, actor.userId, "membership.granted", {
    userId,
  });
}
