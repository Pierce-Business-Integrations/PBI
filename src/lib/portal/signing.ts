import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { audit, id, now, portalDb } from "./db";
import { parseProjectDetails } from "./schema";
import type { PortalActor } from "./auth";
import { isAdmin, mayAccessOrganization } from "./auth";

const endpoint = "https://api.hellosign.com/v3";
const key = () => process.env.DROPBOX_SIGN_API_KEY;
const headers = () => ({
  Authorization: `Basic ${Buffer.from(`${key()}:`).toString("base64")}`,
});
export const signingConfigured = () =>
  Boolean(key() && process.env.DROPBOX_SIGN_CLIENT_ID);

export async function startSigning(actor: PortalActor, documentId: string) {
  if (!(await isAdmin(actor.userId))) throw new Error("Admin access required");
  const db = await portalDb();
  const doc = (
    await db.execute({
      sql: "SELECT d.*,f.content FROM documents d JOIN private_files f ON f.id=d.file_id WHERE d.id=?",
      args: [documentId],
    })
  ).rows[0];
  if (!doc || doc.kind !== "agreement" || doc.status !== "approved")
    throw new Error("An approved agreement is required");
  if (
    (
      await db.execute({
        sql: "SELECT 1 FROM sign_requests WHERE document_id=?",
        args: [documentId],
      })
    ).rows.length
  )
    throw new Error("This revision already has a signing request");
  const source = JSON.parse(String(doc.source_json));
  const details = parseProjectDetails(source.details);
  if (!details.demo)
    throw new Error(
      "Only demo agreements may be sent to the signing sandbox in this build",
    );
  const recipients = [...details.authorizedSigners].sort(
    (a, b) => a.order - b.order,
  );
  if (details.requiresPbiSignature) {
    const pbiEmail =
      process.env.PBI_SIGNER_EMAIL ||
      (process.env.NODE_ENV === "development" && !signingConfigured()
        ? "pbi-simulation@example.test"
        : "");
    if (!pbiEmail)
      throw new Error("PBI_SIGNER_EMAIL is required for sandbox signing");
    recipients.push({
      name: process.env.PBI_SIGNER_NAME || "PBI authorized signer",
      email: pbiEmail,
      title: "PBI",
      order: recipients.length + 1,
    });
  }
  const pdf = await PDFDocument.load(doc.content as Uint8Array);
  const firstSignaturePage = pdf.getPageCount() - recipients.length + 1;
  const fields = recipients.flatMap((recipient, signer) => {
    const page = firstSignaturePage + signer;
    if (details.requiresPbiSignature && signer === recipients.length - 1)
      return [
        {
          document_index: 0,
          api_id: `name_${signer}`,
          name: "PBI authorized name and title",
          type: "text",
          x: 85,
          y: 230,
          width: 390,
          height: 25,
          required: true,
          signer,
          page,
        },
        {
          document_index: 0,
          api_id: `signature_${signer}`,
          name: "PBI signature",
          type: "signature",
          x: 85,
          y: 280,
          width: 280,
          height: 45,
          required: true,
          signer,
          page,
        },
        {
          document_index: 0,
          api_id: `date_${signer}`,
          name: "PBI date",
          type: "date_signed",
          x: 85,
          y: 330,
          width: 170,
          height: 25,
          required: true,
          signer,
          page,
        },
      ];
    return [
      {
        document_index: 0,
        api_id: `name_${signer}`,
        name: `Signer name ${signer + 1}`,
        type: "text",
        x: 85,
        y: 245,
        width: 390,
        height: 25,
        required: true,
        signer,
        page,
      },
      {
        document_index: 0,
        api_id: `title_${signer}`,
        name: `Title ${signer + 1}`,
        type: "text",
        x: 85,
        y: 295,
        width: 390,
        height: 25,
        required: true,
        signer,
        page,
      },
      {
        document_index: 0,
        api_id: `signature_${signer}`,
        name: `Signature ${signer + 1}`,
        type: "signature",
        x: 85,
        y: 345,
        width: 280,
        height: 45,
        required: true,
        signer,
        page,
      },
      {
        document_index: 0,
        api_id: `date_${signer}`,
        name: `Date ${signer + 1}`,
        type: "date_signed",
        x: 85,
        y: 395,
        width: 170,
        height: 25,
        required: true,
        signer,
        page,
      },
    ];
  });
  let providerId: string | null = null;
  let provider = "development-simulation";
  let status = "simulated_pending";
  if (signingConfigured()) {
    const form = new FormData();
    form.set("client_id", process.env.DROPBOX_SIGN_CLIENT_ID!);
    form.set("test_mode", "1");
    form.set("title", `PBI demo agreement - ${details.projectName}`);
    form.set("subject", "PBI demo agreement for sandbox signing");
    form.set(
      "files[0]",
      new Blob([new Uint8Array(doc.content as Uint8Array)], {
        type: "application/pdf",
      }),
      `PBI-agreement-r${doc.revision}.pdf`,
    );
    recipients.forEach((recipient, i) => {
      form.set(`signers[${i}][name]`, recipient.name);
      form.set(`signers[${i}][email_address]`, recipient.email);
      form.set(`signers[${i}][order]`, String(i));
    });
    form.set("form_fields_per_document", JSON.stringify(fields));
    const response = await fetch(
      `${endpoint}/signature_request/create_embedded`,
      { method: "POST", headers: headers(), body: form },
    );
    if (!response.ok)
      throw new Error(`Dropbox Sign test request failed (${response.status})`);
    const payload = await response.json();
    providerId = payload.signature_request?.signature_request_id;
    if (!providerId) throw new Error("Dropbox Sign returned no request ID");
    provider = "dropbox-sign-test";
    status = "pending";
    recipients.forEach((recipient, i) => {
      (recipient as typeof recipient & { signatureId?: string }).signatureId =
        payload.signature_request.signatures?.[i]?.signature_id;
    });
  } else if (process.env.NODE_ENV !== "development")
    throw new Error(
      "Dropbox Sign test credentials are required outside local development",
    );
  const signId = id(),
    at = now();
  await db.batch(
    [
      {
        sql: "INSERT INTO sign_requests VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        args: [
          signId,
          doc.organization_id,
          doc.project_id,
          documentId,
          provider,
          providerId,
          status,
          JSON.stringify(recipients),
          JSON.stringify(fields),
          null,
          null,
          at,
          at,
        ],
      },
      {
        sql: "UPDATE documents SET status='signing' WHERE id=? AND status='approved'",
        args: [documentId],
      },
    ],
    "write",
  );
  await audit(
    String(doc.organization_id),
    String(doc.project_id),
    actor.userId,
    "signing.started",
    { documentId, provider, testMode: true },
  );
  return { signId, provider, status };
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
  if (request.provider !== "dropbox-sign-test" || request.status !== "pending")
    throw new Error("Sandbox signing is unavailable for this request");
  const recipients = JSON.parse(String(request.recipients_json)) as {
    signatureId?: string;
    email: string;
  }[];
  // Membership is the authorization source. The Clerk email must match an assigned recipient.
  const { clerkClient } = await import("@clerk/nextjs/server");
  const user = actor.simulated
    ? null
    : await (await clerkClient()).users.getUser(actor.userId);
  const emails =
    user?.emailAddresses.map((item) => item.emailAddress.toLowerCase()) || [];
  const recipient = recipients.find((item) =>
    emails.includes(item.email.toLowerCase()),
  );
  if (!recipient?.signatureId)
    throw new Error("No signing field is assigned to this identity");
  const response = await fetch(
    `${endpoint}/embedded/sign_url/${recipient.signatureId}`,
    { headers: headers(), cache: "no-store" },
  );
  if (!response.ok)
    throw new Error(`Unable to get Dropbox Sign URL (${response.status})`);
  const payload = await response.json();
  return payload.embedded?.sign_url as string;
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
    !["pending", "awaiting_file", "simulated_pending"].includes(
      String(request.status),
    )
  )
    throw new Error("No active signing request");
  let status = "voided";
  if (request.provider === "dropbox-sign-test") {
    const response = await fetch(
      `${endpoint}/signature_request/cancel/${request.provider_id}`,
      { method: "POST", headers: headers() },
    );
    if (!response.ok)
      throw new Error(`Dropbox Sign cancel failed (${response.status})`);
    status = "cancel_requested";
  }
  await db.execute({
    sql: "UPDATE sign_requests SET status=?,updated_at=? WHERE id=?",
    args: [status, now(), signId],
  });
  if (status === "voided")
    await db.execute({
      sql: "UPDATE documents SET status='voided' WHERE id=?",
      args: [request.document_id],
    });
  await audit(
    String(request.organization_id),
    String(request.project_id),
    actor.userId,
    "signing.void.requested",
    { signId, provider: request.provider },
  );
  return status;
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

export function verifyDropboxEvent(payload: {
  event?: { event_time?: string; event_type?: string; event_hash?: string };
}) {
  if (
    !key() ||
    !payload.event?.event_time ||
    !payload.event?.event_type ||
    !payload.event?.event_hash
  )
    return false;
  const expected = createHmac("sha256", key()!)
    .update(payload.event.event_time + payload.event.event_type)
    .digest("hex");
  const actual = payload.event.event_hash;
  return (
    /^[a-f0-9]{64}$/.test(actual) &&
    timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"))
  );
}

export async function applyDropboxEvent(payload: {
  event: {
    event_time: string;
    event_type: string;
    event_hash: string;
    event_metadata?: { related_signature_id?: string };
  };
  signature_request?: { signature_request_id?: string };
}) {
  if (!verifyDropboxEvent(payload))
    throw new Error("Invalid Dropbox Sign event signature");
  const providerId = payload.signature_request?.signature_request_id;
  if (!providerId) throw new Error("Missing signing request ID");
  const db = await portalDb();
  const request = (
    await db.execute({
      sql: "SELECT * FROM sign_requests WHERE provider_id=?",
      args: [providerId],
    })
  ).rows[0];
  if (!request) throw new Error("Unknown signing request");
  const eventId = `${providerId}:${payload.event.event_hash}:${payload.event.event_metadata?.related_signature_id || ""}`;
  const exists = (
    await db.execute({
      sql: "SELECT 1 FROM provider_events WHERE provider='dropbox-sign' AND event_id=?",
      args: [eventId],
    })
  ).rows.length;
  if (exists) return "duplicate";
  const type = payload.event.event_type;
  if (type === "signature_request_downloadable") {
    const response = await fetch(
      `${endpoint}/signature_request/files/${providerId}?file_type=pdf`,
      { headers: headers() },
    );
    if (!response.ok)
      throw new Error(
        `Signed PDF is not downloadable yet (${response.status})`,
      );
    const bytes = Buffer.from(await response.arrayBuffer());
    const fileId = id(),
      at = now();
    await db.batch(
      [
        {
          sql: "INSERT INTO private_files VALUES (?,?,?,?,?,?,?,?)",
          args: [
            fileId,
            request.organization_id,
            request.project_id,
            "application/pdf",
            "PBI-completed-sandbox-agreement.pdf",
            createHash("sha256").update(bytes).digest("hex"),
            bytes,
            at,
          ],
        },
        {
          sql: "UPDATE sign_requests SET status='completed',completed_file_id=?,audit_file_id=?,updated_at=? WHERE id=?",
          args: [fileId, fileId, at, request.id],
        },
        {
          sql: "UPDATE documents SET status='completed' WHERE id=?",
          args: [request.document_id],
        },
        {
          sql: "INSERT INTO provider_events VALUES (?,?,?,?,?)",
          args: [id(), "dropbox-sign", eventId, JSON.stringify(payload), at],
        },
      ],
      "write",
    );
  } else {
    const status =
      type === "signature_request_all_signed"
        ? "awaiting_file"
        : type === "signature_request_declined"
          ? "declined"
          : type === "signature_request_canceled"
            ? "voided"
            : type === "file_error"
              ? "failed"
              : null;
    const at = now();
    await db.batch(
      [
        {
          sql: "INSERT INTO provider_events VALUES (?,?,?,?,?)",
          args: [id(), "dropbox-sign", eventId, JSON.stringify(payload), at],
        },
        ...(status
          ? [
              {
                sql: "UPDATE sign_requests SET status=?,updated_at=? WHERE id=?",
                args: [status, at, request.id],
              },
            ]
          : []),
        ...(status === "voided"
          ? [
              {
                sql: "UPDATE documents SET status='voided' WHERE id=?",
                args: [request.document_id],
              },
            ]
          : []),
      ],
      "write",
    );
  }
  await audit(
    String(request.organization_id),
    String(request.project_id),
    "dropbox-sign",
    `signing.${type}`,
    { signId: String(request.id), eventId },
  );
  return "processed";
}
