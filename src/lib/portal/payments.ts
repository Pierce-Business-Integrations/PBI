import "server-only";
import Stripe from "stripe";
import { audit, id, now, portalDb } from "./db";
import type { PortalActor } from "./auth";
import { mayAccessOrganization } from "./access";
import { invoiceCanCheckout } from "./payment-status";
import { projectDisplayName } from "./presentation";
import { nullEqual } from "./database-types";

function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_"))
    throw new Error("Stripe test-mode secret key is required");
  return new Stripe(key);
}

export async function checkoutInvoice(
  actor: PortalActor,
  invoiceId: string,
  origin: string,
) {
  const db = await portalDb();
  const invoice = (
    await db.execute({
      sql: "SELECT i.*,p.name AS project_name,o.demo,d.status AS document_status FROM invoices i JOIN projects p ON p.id=i.project_id JOIN organizations o ON o.id=i.organization_id JOIN documents d ON d.id=i.document_id WHERE i.id=?",
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
    throw new Error("Invoice not found");
  if (!Number(invoice.demo))
    throw new Error(
      "Only demo invoices may enter Stripe test checkout in this build",
    );
  if (invoice.document_status !== "approved")
    throw new Error("Invoice must be approved before checkout");
  if (!invoiceCanCheckout(String(invoice.status)))
    throw new Error("This invoice is not payable");
  if (invoice.checkout_attempt)
    throw new Error("Checkout is already opening. Please try again shortly.");
  const provider = stripe();
  if (invoice.stripe_session_id) {
    const existing = await provider.checkout.sessions.retrieve(
      String(invoice.stripe_session_id),
    );
    if (existing.status === "open" && existing.url) return existing.url;
    if (existing.status === "complete")
      throw new Error(
        "Payment confirmation is pending. Please refresh the invoice shortly.",
      );
  }
  const retryKey = invoice.stripe_session_id
    ? `retry-after-${invoice.stripe_session_id}`
    : `v${invoice.revision}`;
  const attempt = id();
  const reserved = await db.execute({
    sql: `UPDATE invoices SET checkout_attempt=?,updated_at=? WHERE id=? AND status IN ('open','failed') AND checkout_attempt IS NULL AND ${nullEqual(db.dialect, "stripe_session_id")} AND EXISTS(SELECT 1 FROM documents WHERE documents.id=invoices.document_id AND documents.status='approved')`,
    args: [attempt, now(), invoiceId, invoice.stripe_session_id],
  });
  if (reserved.rowsAffected !== 1)
    throw new Error(
      "Checkout is already opening or this invoice is no longer payable.",
    );
  let session: Stripe.Checkout.Session;
  try {
    session = await provider.checkout.sessions.create(
      {
        mode: "payment",
        allowed_payment_method_types:
          process.env.STRIPE_ENABLE_ACH === "true"
            ? ["card", "us_bank_account"]
            : ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: Number(invoice.amount_cents),
              product_data: {
                name: `PBI invoice for ${projectDisplayName(String(invoice.project_name), Boolean(invoice.demo))}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          portal_invoice_id: invoiceId,
          portal_document_id: String(invoice.document_id),
          portal_amount_cents: String(invoice.amount_cents),
        },
        payment_intent_data: { metadata: { portal_invoice_id: invoiceId } },
        success_url: `${origin}/portal/invoices/${invoiceId}?payment=returned`,
        cancel_url: `${origin}/portal/invoices/${invoiceId}?payment=cancelled`,
      },
      { idempotencyKey: `portal-invoice-${invoiceId}-${retryKey}` },
    );
    if (!session.url) throw new Error("Stripe returned no checkout URL");
    await db.execute({
      sql: "UPDATE invoices SET stripe_session_id=?,checkout_attempt=NULL,updated_at=? WHERE id=? AND checkout_attempt=?",
      args: [session.id, now(), invoiceId, attempt],
    });
  } catch (error) {
    await db.execute({
      sql: "UPDATE invoices SET checkout_attempt=NULL WHERE id=? AND checkout_attempt=?",
      args: [invoiceId, attempt],
    });
    throw error;
  }
  await audit(
    String(invoice.organization_id),
    String(invoice.project_id),
    actor.userId,
    "invoice.checkout.started",
    { invoiceId, sessionId: session.id },
  );
  return session.url;
}

export async function applyStripeEvent(raw: string, signature: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret?.startsWith("whsec_") || !signature)
    throw new Error("Stripe webhook signing secret required");
  const event = stripe().webhooks.constructEvent(raw, signature, secret);
  const db = await portalDb();
  if (
    (
      await db.execute({
        sql: "SELECT 1 FROM provider_events WHERE provider='stripe' AND event_id=?",
        args: [event.id],
      })
    ).rows.length
  )
    return "duplicate";
  let invoiceId: string | null = null;
  let nextStatus: string | null = null;
  let paymentIntentId: string | null = null;
  if (
    [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.async_payment_failed",
    ].includes(event.type)
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    invoiceId = session.metadata?.portal_invoice_id || null;
    paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;
    if (event.type === "checkout.session.async_payment_succeeded")
      nextStatus = "paid";
    else if (event.type === "checkout.session.async_payment_failed")
      nextStatus = "failed";
    else nextStatus = session.payment_status === "paid" ? "paid" : "processing";
    if (!invoiceId) throw new Error("Missing invoice metadata");
    const invoice = (
      await db.execute({
        sql: "SELECT * FROM invoices WHERE id=?",
        args: [invoiceId],
      })
    ).rows[0];
    if (
      !invoice ||
      invoice.stripe_session_id !== session.id ||
      Number(invoice.amount_cents) !== session.amount_total ||
      invoice.currency !== session.currency ||
      session.metadata?.portal_amount_cents !== String(invoice.amount_cents)
    )
      throw new Error("Stripe invoice/session mismatch");
    if (
      ["paid", "partially_refunded", "refunded"].includes(
        String(invoice.status),
      ) &&
      nextStatus !== "refunded"
    )
      nextStatus = null;
  } else if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    paymentIntentId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id || null;
    const invoice = paymentIntentId
      ? (
          await db.execute({
            sql: "SELECT * FROM invoices WHERE stripe_payment_intent_id=?",
            args: [paymentIntentId],
          })
        ).rows[0]
      : null;
    if (!invoice) throw new Error("Refund references an unknown invoice");
    invoiceId = String(invoice.id);
    nextStatus =
      charge.amount_refunded >= charge.amount
        ? "refunded"
        : "partially_refunded";
  }
  const at = now();
  await db.batch(
    [
      {
        sql: "INSERT INTO provider_events (id,provider,event_id,payload_json,received_at) VALUES (?,?,?,?,?)",
        args: [id(), "stripe", event.id, raw, at],
      },
      ...(invoiceId && nextStatus
        ? [
            {
              sql: "UPDATE invoices SET status=?,stripe_payment_intent_id=COALESCE(?,stripe_payment_intent_id),updated_at=? WHERE id=?",
              args: [nextStatus, paymentIntentId, at, invoiceId],
            },
          ]
        : []),
    ],
    "write",
  );
  if (invoiceId && nextStatus) {
    const invoice = (
      await db.execute({
        sql: "SELECT organization_id,project_id FROM invoices WHERE id=?",
        args: [invoiceId],
      })
    ).rows[0];
    await audit(
      String(invoice.organization_id),
      String(invoice.project_id),
      "stripe",
      `invoice.${nextStatus}`,
      { invoiceId, eventId: event.id },
    );
  }
  return "processed";
}
