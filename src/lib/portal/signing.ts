import "server-only";
import { PDFDocument } from "pdf-lib";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { audit, id, now, portalDb } from "./db";
import { parseProjectDetails } from "./schema";
import type { PortalActor } from "./auth";
import { isAdmin, mayAccessOrganization } from "./access";
import { preparePrivateFile, privateFileBytes } from "./storage";
import { readSigningFields } from "./signing-fields";
import { signWellEventSchema, verifySignWellEvent } from "./signwell-events";
import { assertProviderRecord } from "./configuration";

const endpoint = "https://www.signwell.com/api/v1";
export const signingConfigured = () =>
  Boolean(process.env.SIGNWELL_API_KEY && process.env.SIGNWELL_WEBHOOK_ID);
const providerDocument = z
  .object({
    id: z.string().uuid(),
    status: z.string(),
    test_mode: z.boolean(),
    metadata: z
      .object({ portal_document_id: z.string(), portal_sign_id: z.string() })
      .passthrough(),
    recipients: z.array(
      z
        .object({
          id: z.string(),
          email: z.string(),
          status: z.string().optional(),
          embedded_signing_url: z.string().optional(),
        })
        .passthrough(),
    ),
  })
  .passthrough();
type ProviderDocument = z.infer<typeof providerDocument>;
async function signWell(path: string, options: RequestInit = {}) {
  if (!process.env.SIGNWELL_API_KEY)
    throw new Error("Signing is not configured");
  return fetch(`${endpoint}${path}`, {
    ...options,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: {
      "X-Api-Key": process.env.SIGNWELL_API_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}
async function getProviderDocument(providerId: string) {
  const response = await signWell(
    `/documents/${encodeURIComponent(providerId)}`,
  );
  if (!response.ok)
    throw new Error("Unable to verify the signing document. Please try again.");
  return providerDocument.parse(await response.json());
}
function matchesRequest(
  resource: ProviderDocument,
  request: Record<string, unknown>,
) {
  if (
    resource.test_mode !== (request.provider !== "signwell-live") ||
    resource.id !== request.provider_id ||
    resource.metadata.portal_document_id !== request.document_id ||
    resource.metadata.portal_sign_id !== request.id
  )
    throw new Error("Signing document does not match the approved agreement");
}

export async function startSigning(actor: PortalActor, documentId: string) {
  if (!(await isAdmin(actor.userId))) throw new Error("Admin access required");
  const db = await portalDb();
  const doc = (
    await db.execute({
      sql: "SELECT d.*,f.content,f.storage_path,f.sha256 FROM documents d JOIN private_files f ON f.id=d.file_id WHERE d.id=?",
      args: [documentId],
    })
  ).rows[0];
  if (!doc || doc.kind !== "agreement" || doc.status !== "approved")
    throw new Error("An approved agreement is required");
  const details = parseProjectDetails(
    JSON.parse(String(doc.source_json)).details,
  );
  const mode = assertProviderRecord(details.demo, actor.simulated, db.dialect);
  const providerName = mode === "live" ? "signwell-live" : "signwell-test";
  const bytes = await privateFileBytes(doc);
  const fields = await readSigningFields(bytes);
  const recipients = [...details.authorizedSigners]
    .sort((a, b) => a.order - b.order)
    .map((signer, index) => ({ ...signer, id: String(index + 1) }));
  if (details.requiresPbiSignature) {
    const email =
      process.env.PBI_SIGNER_EMAIL ||
      (process.env.NODE_ENV === "development" && !signingConfigured()
        ? "pbi-simulation@example.test"
        : "");
    if (!email) throw new Error("PBI_SIGNER_EMAIL is required for signing");
    recipients.push({
      name: process.env.PBI_SIGNER_NAME || "PBI authorized signer",
      email,
      title: "PBI",
      order: recipients.length + 1,
      id: String(recipients.length + 1),
    });
  }
  if (
    fields.some(
      (field) =>
        !recipients.some((recipient) => recipient.id === field.recipient_id),
    )
  )
    throw new Error("Agreement signer fields do not match its recipients");
  const real = signingConfigured();
  if (
    !real &&
    (process.env.NODE_ENV !== "development" ||
      !actor.simulated ||
      db.dialect !== "sqlite")
  )
    throw new Error("SignWell credentials are required for signing");
  const signId = id();
  const tx = await db.transaction("write");
  try {
    const reserved = await tx.execute({
      sql: "UPDATE documents SET status='signing' WHERE id=? AND status='approved'",
      args: [documentId],
    });
    if (reserved.rowsAffected !== 1)
      throw new Error("This agreement is already being prepared for signing");
    await tx.execute({
      sql: "INSERT INTO sign_requests (id,organization_id,project_id,document_id,provider,provider_id,status,recipients_json,fields_json,completed_file_id,audit_file_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      args: [
        signId,
        doc.organization_id,
        doc.project_id,
        documentId,
        real ? providerName : "development-simulation",
        null,
        real ? "preparing" : "simulated_pending",
        JSON.stringify(recipients),
        JSON.stringify(fields),
        null,
        null,
        now(),
        now(),
      ],
    });
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
  if (real) {
    // Reserve before calling the provider. Do not auto-resubmit after an uncertain response.
    try {
      const response = await signWell("/documents", {
        method: "POST",
        body: JSON.stringify({
          name: `PBI agreement: ${details.projectName}`,
          test_mode: mode === "test",
          draft: false,
          embedded_signing: true,
          embedded_signing_notifications: false,
          reminders: false,
          apply_signing_order: true,
          allow_reassign: false,
          files: [
            {
              name: `PBI-agreement-r${doc.revision}.pdf`,
              file_base64: Buffer.from(bytes).toString("base64"),
            },
          ],
          recipients: recipients.map(({ id, name, email }) => ({
            id,
            name,
            email,
            send_email: false,
          })),
          fields: [fields],
          metadata: { portal_document_id: documentId, portal_sign_id: signId },
        }),
      });
      if (!response.ok) {
        if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 408 &&
          response.status !== 429
        ) {
          await db.batch(
            [
              {
                sql: "UPDATE sign_requests SET status='failed',updated_at=? WHERE id=?",
                args: [now(), signId],
              },
              {
                sql: "UPDATE documents SET status='approved' WHERE id=?",
                args: [documentId],
              },
            ],
            "write",
          );
          throw new Error(
            "SignWell could not prepare this agreement. Review the signer details and generate a new revision.",
          );
        }
        throw new Error("SignWell did not confirm the request");
      }
      const resource = providerDocument.parse(await response.json());
      matchesRequest(resource, {
        provider: providerName,
        id: signId,
        provider_id: resource.id,
        document_id: documentId,
      });
      await db.execute({
        sql: "UPDATE sign_requests SET provider_id=?,status='pending',updated_at=? WHERE id=?",
        args: [resource.id, now(), signId],
      });
    } catch (error) {
      await db.execute({
        sql: "UPDATE sign_requests SET status='submission_unknown',updated_at=? WHERE id=? AND status='preparing'",
        args: [now(), signId],
      });
      throw error;
    }
  }
  await audit(
    String(doc.organization_id),
    String(doc.project_id),
    actor.userId,
    "signing.started",
    {
      documentId,
      provider: real ? providerName : "development-simulation",
      testMode: mode === "test",
    },
  );
  return {
    signId,
    provider: real ? providerName : "development-simulation",
    status: real ? "pending" : "simulated_pending",
  };
}

export async function signerUrl(actor: PortalActor, signId: string) {
  const db = await portalDb();
  const request = (
    await db.execute({
      sql: "SELECT * FROM sign_requests WHERE id=?",
      args: [signId],
    })
  ).rows[0];
  if (
    !request ||
    !(await mayAccessOrganization(
      actor.userId,
      String(request.organization_id),
    ))
  )
    throw new Error("Signing request not found");
  if (
    actor.simulated ||
    !["signwell-test", "signwell-live"].includes(String(request.provider)) ||
    request.status !== "pending"
  )
    throw new Error("Signing is unavailable for this request");
  const { data, error } = await supabaseAdmin().auth.admin.getUserById(
    actor.userId,
  );
  if (error || !data.user?.email || !data.user.email_confirmed_at)
    throw new Error("Verify your email before signing");
  const recipients = JSON.parse(String(request.recipients_json)) as {
    id: string;
    email: string;
  }[];
  const recipient = recipients.find(
    (person) => person.email.toLowerCase() === data.user.email!.toLowerCase(),
  );
  if (!recipient)
    throw new Error("No signing fields are assigned to this identity");
  const resource = await getProviderDocument(String(request.provider_id));
  matchesRequest(resource, request);
  const assigned = resource.recipients.find(
    (person) =>
      person.id === recipient.id &&
      person.email.toLowerCase() === recipient.email.toLowerCase(),
  );
  const url = assigned?.embedded_signing_url;
  if (!url || assigned?.status?.toLowerCase() === "signed")
    throw new Error(
      "Your signature is complete or it is another signer's turn",
    );
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== "www.signwell.com")
    throw new Error("Invalid signing destination");
  await audit(
    String(request.organization_id),
    String(request.project_id),
    actor.userId,
    "signing.opened",
    { signId },
  );
  return url;
}

export async function voidSigning(actor: PortalActor, signId: string) {
  if (!(await isAdmin(actor.userId))) throw new Error("Admin access required");
  const db = await portalDb();
  const request = (
    await db.execute({
      sql: "SELECT * FROM sign_requests WHERE id=?",
      args: [signId],
    })
  ).rows[0];
  if (
    !request ||
    !["pending", "simulated_pending"].includes(String(request.status))
  )
    throw new Error("No cancellable signing request");
  if (["signwell-test", "signwell-live"].includes(String(request.provider))) {
    const resource = await getProviderDocument(String(request.provider_id));
    matchesRequest(resource, request);
    if (resource.status.toLowerCase() === "completed")
      throw new Error("A completed agreement cannot be voided here");
    const response = await signWell(
      `/documents/${encodeURIComponent(String(request.provider_id))}`,
      { method: "DELETE" },
    );
    if (!response.ok)
      throw new Error(
        "Unable to cancel this signing request. Please try again.",
      );
  } else if (request.provider !== "development-simulation")
    throw new Error(
      "This request uses a previous signing provider; reconcile it before replacing the agreement",
    );
  await db.batch(
    [
      {
        sql: "UPDATE sign_requests SET status='voided',updated_at=? WHERE id=? AND status IN ('pending','simulated_pending')",
        args: [now(), signId],
      },
      {
        sql: "UPDATE documents SET status='voided' WHERE id=? AND status='signing'",
        args: [request.document_id],
      },
    ],
    "write",
  );
  await audit(
    String(request.organization_id),
    String(request.project_id),
    actor.userId,
    "signing.voided",
    { signId },
  );
  return "voided";
}

export async function simulateSigning(actor: PortalActor, signId: string) {
  if (process.env.NODE_ENV !== "development" || !actor.simulated)
    throw new Error("Development simulation unavailable");
  const db = await portalDb();
  const request = (
    await db.execute({
      sql: "SELECT * FROM sign_requests WHERE id=?",
      args: [signId],
    })
  ).rows[0];
  if (
    !request ||
    request.status !== "simulated_pending" ||
    request.provider !== "development-simulation" ||
    !(await mayAccessOrganization(
      actor.userId,
      String(request.organization_id),
    ))
  )
    throw new Error("Simulation request not found");
  await db.execute({
    sql: "UPDATE sign_requests SET status='simulated_complete',updated_at=? WHERE id=?",
    args: [now(), signId],
  });
  await audit(
    String(request.organization_id),
    String(request.project_id),
    actor.userId,
    "signing.simulated.complete",
    { signId, noSignatureOrSignedPdf: true },
  );
}

export async function acceptSignWellEvent(raw: unknown) {
  if (!verifySignWellEvent(raw, process.env.SIGNWELL_WEBHOOK_ID))
    throw new Error("Invalid SignWell event signature");
  const payload = signWellEventSchema.parse(raw);
  const db = await portalDb();
  let request = (
    await db.execute({
      sql: "SELECT id FROM sign_requests WHERE provider IN ('signwell-test','signwell-live') AND provider_id=?",
      args: [payload.data.object.id],
    })
  ).rows[0];
  if (!request) {
    // A callback can arrive before the create response, or after a network timeout.
    // Bind it only after the provider itself confirms our reserved request metadata.
    const resource = await getProviderDocument(payload.data.object.id);
    const reserved = (
      await db.execute({
        sql: "SELECT * FROM sign_requests WHERE id=? AND provider IN ('signwell-test','signwell-live') AND provider_id IS NULL AND status IN ('preparing','submission_unknown')",
        args: [resource.metadata.portal_sign_id],
      })
    ).rows[0];
    if (reserved) {
      matchesRequest(resource, {
        ...reserved,
        id: reserved.id,
        document_id: reserved.document_id,
        provider_id: resource.id,
      });
      await db.execute({
        sql: "UPDATE sign_requests SET provider_id=?,status='pending',updated_at=? WHERE id=? AND provider_id IS NULL",
        args: [resource.id, now(), reserved.id],
      });
      request = reserved;
    }
  }
  if (!request) throw new Error("Unknown signing request");
  const eventId = `${payload.data.object.id}:${payload.event.hash}:${payload.event.related_signer?.email || ""}`;
  await db.execute({
    sql: "INSERT INTO provider_events (id,provider,event_id,payload_json,received_at) VALUES (?,?,?,?,?) ON CONFLICT(provider,event_id) DO NOTHING",
    args: [id(), "signwell", eventId, JSON.stringify(payload), now()],
  });
  return eventId;
}

// Reconcile authoritative provider state, never a browser's 'completed' callback or unsigned object fields.
export async function processSignWellEvent(eventId: string) {
  const db = await portalDb();
  const event = (
    await db.execute({
      sql: "SELECT * FROM provider_events WHERE provider='signwell' AND event_id=?",
      args: [eventId],
    })
  ).rows[0];
  if (!event || event.processed_at) return "duplicate";
  const payload = signWellEventSchema.parse(
    JSON.parse(String(event.payload_json)),
  );
  const request = (
    await db.execute({
      sql: "SELECT * FROM sign_requests WHERE provider IN ('signwell-test','signwell-live') AND provider_id=?",
      args: [payload.data.object.id],
    })
  ).rows[0];
  if (!request) throw new Error("Unknown signing request");
  try {
    // Completed or owner-voided originals are immutable and cannot regress on delayed events.
    if (["completed", "voided"].includes(String(request.status))) {
      await db.execute({
        sql: "UPDATE provider_events SET processed_at=?,last_error=NULL WHERE id=?",
        args: [now(), event.id],
      });
      return "processed";
    }
    const resource = await getProviderDocument(String(request.provider_id));
    matchesRequest(resource, request);
    const status = resource.status.toLowerCase();
    if (status === "completed") {
      await db.execute({
        sql: "UPDATE sign_requests SET status='awaiting_file',updated_at=? WHERE id=? AND status!='completed'",
        args: [now(), request.id],
      });
      const response = await signWell(
        `/documents/${encodeURIComponent(resource.id)}/completed_pdf?url_only=false&audit_page=true&file_format=pdf`,
      );
      if (!response.ok)
        throw new Error(
          "Completed agreement is still being prepared by SignWell",
        );
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (Buffer.from(bytes.subarray(0, 5)).toString() !== "%PDF-")
        throw new Error("SignWell returned an invalid completed PDF");
      await PDFDocument.load(bytes);
      const fileId = id();
      const file = await preparePrivateFile({
        id: fileId,
        organizationId: String(request.organization_id),
        projectId: String(request.project_id),
        filename: "PBI-completed-agreement.pdf",
        bytes,
      });
      const tx = await db.transaction("write");
      try {
        const current = (
          await tx.execute({
            sql: `SELECT completed_file_id,status FROM sign_requests WHERE id=?${db.dialect === "postgres" ? " FOR UPDATE" : ""}`,
            args: [request.id],
          })
        ).rows[0];
        if (current.completed_file_id || current.status === "voided") {
          await tx.rollback();
          await file.discard();
          await db.execute({
            sql: "UPDATE provider_events SET processed_at=?,last_error=NULL WHERE id=?",
            args: [now(), event.id],
          });
          return "duplicate";
        }
        await tx.execute(file.statement);
        // The provider's combined completed PDF includes its audit page.
        await tx.execute({
          sql: "UPDATE sign_requests SET status='completed',completed_file_id=?,audit_file_id=?,updated_at=? WHERE id=?",
          args: [fileId, fileId, now(), request.id],
        });
        await tx.execute({
          sql: "UPDATE documents SET status='completed' WHERE id=?",
          args: [request.document_id],
        });
        await tx.execute({
          sql: "UPDATE provider_events SET processed_at=?,last_error=NULL WHERE id=?",
          args: [now(), event.id],
        });
        await tx.commit();
      } catch (error) {
        await tx.rollback();
        await file.discard();
        throw error;
      } finally {
        tx.close();
      }
    } else {
      const nextStatus =
        status === "declined"
          ? "declined"
          : ["canceled", "cancelled", "expired"].includes(status)
            ? "voided"
            : status === "error"
              ? "failed"
              : null;
      await db.batch(
        [
          ...(nextStatus
            ? [
                {
                  sql: "UPDATE sign_requests SET status=?,updated_at=? WHERE id=? AND status NOT IN ('completed','voided')",
                  args: [nextStatus, now(), request.id],
                },
              ]
            : []),
          ...(nextStatus === "voided"
            ? [
                {
                  sql: "UPDATE documents SET status='voided' WHERE id=? AND status='signing'",
                  args: [request.document_id],
                },
              ]
            : []),
          {
            sql: "UPDATE provider_events SET processed_at=?,last_error=NULL WHERE id=?",
            args: [now(), event.id],
          },
        ],
        "write",
      );
    }
    await audit(
      String(request.organization_id),
      String(request.project_id),
      "signwell",
      "signing.provider.reconciled",
      { providerId: resource.id, status },
    );
    return "processed";
  } catch (error) {
    await db.execute({
      sql: "UPDATE provider_events SET last_error=? WHERE id=?",
      args: [
        `${now()}: Provider reconciliation pending; retry required`,
        event.id,
      ],
    });
    throw error;
  }
}

export async function retrySignWellEvents(limit = 10) {
  const db = await portalDb();
  const events = (
    await db.execute({
      sql: "SELECT event_id FROM provider_events WHERE provider='signwell' AND processed_at IS NULL ORDER BY CASE WHEN last_error IS NULL THEN 0 ELSE 1 END,CASE WHEN last_error LIKE '20%' THEN last_error ELSE received_at END,received_at LIMIT ?",
      args: [limit],
    })
  ).rows;
  let completed = 0;
  for (const event of events) {
    try {
      await processSignWellEvent(String(event.event_id));
      completed++;
    } catch {
      /* Persisted for the next retry; never log signing links or document contents. */
    }
  }
  const remaining = Number(
    (
      await db.execute(
        "SELECT count(*) AS count FROM provider_events WHERE provider='signwell' AND processed_at IS NULL",
      )
    ).rows[0]?.count || 0,
  );
  return { completed, remaining };
}
