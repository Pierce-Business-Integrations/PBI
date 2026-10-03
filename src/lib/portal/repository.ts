import "server-only";
import { jsonText, type PortalStatement } from "./database-types";
import { preparePrivateFile, privateFileBytes } from "./storage";
import { audit, id, now, portalDb } from "./db";
import {
  renderPortalDocument,
  TEMPLATE_VERSION,
  type DocumentKind,
} from "./documents";
import { parseProjectDetails, type ProjectDetails } from "./schema";
import type { PortalActor } from "./auth";
import { isAdmin, mayAccessOrganization } from "./access";
import {
  invoiceDraftSchema,
  stagePlanSchema,
  type ProjectStage,
} from "./stages";

export async function listProjects(actor: PortalActor) {
  const db = await portalDb();
  return (
    await db.execute({
      sql: `SELECT DISTINCT p.id,p.organization_id,p.name,p.updated_at,o.name AS organization_name,o.demo FROM projects p JOIN organizations o ON o.id=p.organization_id JOIN memberships m ON m.user_id=? AND (m.organization_id=p.organization_id OR m.role='admin') ORDER BY p.updated_at DESC`,
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
      sql: `SELECT i.id,i.document_id,i.revision,i.amount_cents,i.currency,i.status,i.simulation_status,i.created_at,i.stage_id,d.status AS document_status,${jsonText(db.dialect, "d.source_json", ["invoice", "due"])} AS due FROM invoices i JOIN documents d ON d.id=i.document_id WHERE i.project_id=?${admin ? "" : " AND d.status!='draft'"} ORDER BY i.created_at DESC`,
      args: [projectId],
    })
  ).rows;
  const signing = (
    await db.execute({
      sql: "SELECT id,document_id,provider,status,completed_file_id,audit_file_id FROM sign_requests WHERE project_id=? ORDER BY created_at DESC",
      args: [projectId],
    })
  ).rows;
  const stages = (
    await db.execute({
      sql: "SELECT * FROM project_stages WHERE project_id=? ORDER BY position",
      args: [projectId],
    })
  ).rows.map((stage): ProjectStage => ({
    id: String(stage.id),
    title: String(stage.title),
    description: String(stage.description),
    deliverables: JSON.parse(String(stage.deliverables_json)),
    status: stage.status as ProjectStage["status"],
    position: Number(stage.position),
    updatedAt: String(stage.updated_at),
    completedAt: stage.completed_at ? String(stage.completed_at) : null,
  }));
  return {
    project,
    details: parseProjectDetails(JSON.parse(String(project.details_json))),
    documents,
    invoices,
    signing,
    stages,
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
        sql: "INSERT INTO projects (id,organization_id,name,details_json,draft_version,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
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
  invoice?: { amountCents: number; due: string; stageId?: string },
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
  if (kind === "invoice") invoice = invoiceDraftSchema.parse(invoice);
  let stageSnapshot:
    { id: string; title: string; description: string } | undefined;
  if (invoice?.stageId) {
    const stage = (
      await db.execute({
        sql: "SELECT * FROM project_stages WHERE id=? AND project_id=?",
        args: [invoice.stageId, projectId],
      })
    ).rows[0];
    if (!stage) throw new Error("Stage not found in this project");
    if (
      (
        await db.execute({
          sql: "SELECT 1 FROM invoices WHERE stage_id=? AND status!='voided'",
          args: [invoice.stageId],
        })
      ).rows.length
    )
      throw new Error(
        "This stage already has an invoice. Void it before issuing a replacement.",
      );
    stageSnapshot = {
      id: String(stage.id),
      title: String(stage.title),
      description: String(stage.description),
    };
  }
  if (kind === "agreement") {
    const active = (
      await db.execute({
        sql: "SELECT 1 FROM sign_requests WHERE project_id=? AND status IN ('preparing','submission_unknown','pending','awaiting_file','cancel_requested','simulated_pending') LIMIT 1",
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
    invoice && { ...invoice, number: invoiceNumber, stage: stageSnapshot },
  );
  const fileId = id(),
    documentId = id(),
    invoiceId = kind === "invoice" ? id() : null,
    at = now();
  const orgId = String(project.organization_id);
  const source = JSON.stringify({
    details,
    invoice: invoice
      ? { ...invoice, number: invoiceNumber, stage: stageSnapshot }
      : null,
  });
  const file = await preparePrivateFile({
    id: fileId,
    organizationId: orgId,
    projectId,
    filename: `PBI-${kind}-r${revision}.pdf`,
    bytes,
  });
  const queries: PortalStatement[] = [
    file.statement,
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
      sql: "INSERT INTO invoices (id,organization_id,project_id,document_id,revision,amount_cents,currency,status,stripe_session_id,stripe_payment_intent_id,created_at,updated_at,simulation_status,stage_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
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
        invoice.stageId || null,
      ],
    });
  try {
    await db.batch(queries, "write");
  } catch (error) {
    await file.discard();
    throw error;
  }
  await audit(orgId, projectId, actor.userId, `${kind}.created`, {
    documentId,
    revision,
    template: TEMPLATE_VERSION,
  });
  return { documentId, invoiceId };
}

export async function saveStagePlan(
  actor: PortalActor,
  projectId: string,
  raw: unknown,
) {
  if (!(await isAdmin(actor.userId))) throw new Error("Admin access required");
  const plan = stagePlanSchema.parse(raw);
  const db = await portalDb();
  const tx = await db.transaction("write");
  let organizationId: string;
  try {
    const project = (
      await tx.execute({
        sql: "SELECT organization_id,stage_version FROM projects WHERE id=?",
        args: [projectId],
      })
    ).rows[0];
    if (!project) throw new Error("Project not found");
    organizationId = String(project.organization_id);
    if (Number(project.stage_version) !== plan.version)
      throw new Error(
        "The stage plan changed. Refresh before saving your updates.",
      );
    const existing = (
      await tx.execute({
        sql: "SELECT id FROM project_stages WHERE project_id=?",
        args: [projectId],
      })
    ).rows;
    const wanted = new Set(plan.stages.map((stage) => stage.id));
    for (const stage of existing) {
      if (!wanted.has(String(stage.id))) {
        if (
          (
            await tx.execute({
              sql: "SELECT 1 FROM invoices WHERE stage_id=? LIMIT 1",
              args: [stage.id],
            })
          ).rows.length
        )
          throw new Error("A stage with invoice history cannot be removed");
        await tx.execute({
          sql: "DELETE FROM project_stages WHERE id=? AND project_id=?",
          args: [stage.id, projectId],
        });
      }
    }
    // Reset inside the transaction so changing the current stage never violates the unique index.
    await tx.execute({
      sql: "UPDATE project_stages SET status='planned' WHERE project_id=?",
      args: [projectId],
    });
    const at = now();
    for (const [position, stage] of plan.stages.entries()) {
      const collision = (
        await tx.execute({
          sql: "SELECT project_id FROM project_stages WHERE id=?",
          args: [stage.id],
        })
      ).rows[0];
      if (collision && collision.project_id !== projectId)
        throw new Error("Stage not found in this project");
      await tx.execute({
        sql: "INSERT INTO project_stages (id,project_id,position,title,description,deliverables_json,status,updated_at,completed_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET position=excluded.position,title=excluded.title,description=excluded.description,deliverables_json=excluded.deliverables_json,status=excluded.status,updated_at=excluded.updated_at,completed_at=CASE WHEN excluded.status='complete' THEN COALESCE(project_stages.completed_at,excluded.completed_at) ELSE NULL END",
        args: [
          stage.id,
          projectId,
          position,
          stage.title,
          stage.description,
          JSON.stringify(stage.deliverables),
          stage.status,
          at,
          stage.status === "complete" ? at : null,
        ],
      });
    }
    await tx.execute({
      sql: "UPDATE projects SET stage_version=stage_version+1,updated_at=? WHERE id=?",
      args: [at, projectId],
    });
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
  await audit(
    organizationId,
    projectId,
    actor.userId,
    "project.stages.updated",
    { version: plan.version + 1, stages: plan.stages },
  );
  return { version: plan.version + 1 };
}

export async function linkStageInvoice(
  actor: PortalActor,
  projectId: string,
  stageId: string,
  invoiceId: string,
) {
  if (!(await isAdmin(actor.userId))) throw new Error("Admin access required");
  const db = await portalDb();
  const tx = await db.transaction("write");
  let organizationId: string;
  try {
    const stage = (
      await tx.execute({
        sql: "SELECT id FROM project_stages WHERE id=? AND project_id=?",
        args: [stageId, projectId],
      })
    ).rows[0];
    const invoice = (
      await tx.execute({
        sql: "SELECT * FROM invoices WHERE id=? AND project_id=?",
        args: [invoiceId, projectId],
      })
    ).rows[0];
    if (!stage || !invoice)
      throw new Error("Stage or invoice not found in this project");
    organizationId = String(invoice.organization_id);
    if (invoice.stage_id !== stageId) {
      if (
        invoice.stage_id ||
        invoice.stripe_session_id ||
        invoice.checkout_attempt ||
        invoice.status !== "open"
      )
        throw new Error(
          "Only an unassigned invoice without payment activity can be linked",
        );
      if (
        (
          await tx.execute({
            sql: "SELECT 1 FROM invoices WHERE stage_id=? AND status!='voided'",
            args: [stageId],
          })
        ).rows.length
      )
        throw new Error("This stage already has an invoice");
      await tx.execute({
        sql: "UPDATE invoices SET stage_id=?,updated_at=? WHERE id=?",
        args: [stageId, now(), invoiceId],
      });
    }
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
  await audit(organizationId, projectId, actor.userId, "invoice.stage.linked", {
    invoiceId,
    stageId,
  });
}

export async function getInvoiceBundle(actor: PortalActor, invoiceId: string) {
  const db = await portalDb();
  const invoice = (
    await db.execute({
      sql: `SELECT i.*,d.status AS document_status,d.file_id,d.source_json,p.name AS project_name,o.demo,COALESCE(${jsonText(db.dialect, "d.source_json", ["invoice", "stage", "title"])},s.title) AS stage_title FROM invoices i JOIN documents d ON d.id=i.document_id JOIN projects p ON p.id=i.project_id JOIN organizations o ON o.id=i.organization_id LEFT JOIN project_stages s ON s.id=i.stage_id WHERE i.id=?`,
      args: [invoiceId],
    })
  ).rows[0];
  if (
    !invoice ||
    !(await mayAccessOrganization(
      actor.userId,
      String(invoice.organization_id),
    ))
  )
    return null;
  if (invoice.document_status === "draft" && !(await isAdmin(actor.userId)))
    return null;
  const source = JSON.parse(String(invoice.source_json));
  return { invoice, source };
}

export async function voidInvoice(actor: PortalActor, invoiceId: string) {
  if (!(await isAdmin(actor.userId))) throw new Error("Admin access required");
  const db = await portalDb();
  const tx = await db.transaction("write");
  let invoice;
  try {
    invoice = (
      await tx.execute({
        sql: "SELECT * FROM invoices WHERE id=?",
        args: [invoiceId],
      })
    ).rows[0];
    if (!invoice) throw new Error("Invoice not found");
    if (
      !["open", "failed"].includes(String(invoice.status)) ||
      invoice.stripe_session_id ||
      invoice.checkout_attempt
    )
      throw new Error(
        "Only an unpaid invoice without checkout activity can be voided",
      );
    await tx.execute({
      sql: "UPDATE invoices SET status='voided',updated_at=? WHERE id=?",
      args: [now(), invoiceId],
    });
    await tx.execute({
      sql: "UPDATE documents SET status='voided' WHERE id=?",
      args: [invoice.document_id],
    });
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
  await audit(
    String(invoice.organization_id),
    String(invoice.project_id),
    actor.userId,
    "invoice.voided",
    { invoiceId },
  );
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
  const row = (
    await db.execute({
      sql: "SELECT * FROM private_files WHERE id=?",
      args: [fileId],
    })
  ).rows[0];
  return row
    ? {
        id: row.id,
        organization_id: row.organization_id,
        project_id: row.project_id,
        filename: row.filename,
        mime_type: row.mime_type,
        content: await privateFileBytes(row),
      }
    : null;
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
  if (await isAdmin(userId))
    throw new Error("An owner account cannot be reassigned as a client");
  await db.execute({
    sql: "INSERT INTO memberships VALUES (?,?,?,?,?) ON CONFLICT(organization_id,user_id) DO UPDATE SET role='client'",
    args: [id(), organizationId, userId, "client", now()],
  });
  await audit(organizationId, null, actor.userId, "membership.granted", {
    userId,
  });
}
