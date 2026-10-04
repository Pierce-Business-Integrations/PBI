import "server-only";
import Stripe from "stripe";
import { z } from "zod";
import { audit, id, now, portalDb } from "./db";
import type { PortalActor } from "./auth";
import { mayAccessOrganization } from "./access";
import { invoiceCanCheckout, nextInvoiceStatus } from "./payment-status";
import { projectDisplayName } from "./presentation";
import { nullEqual } from "./database-types";
import { assertProviderRecord, portalProviderMode } from "./configuration";

function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  const mode = portalProviderMode();
  if (!key?.startsWith(mode === "test" ? "sk_test_" : "sk_live_"))
    throw new Error(`Stripe ${mode}-mode secret key is required`);
  return new Stripe(key, { timeout: 20_000, maxNetworkRetries: 1 });
}

function validateCheckout(
  session: Stripe.Checkout.Session,
  invoice: Record<string, unknown>,
  mode: "test" | "live",
) {
  if (
    session.mode !== "payment" ||
    session.livemode !== (mode === "live") ||
    session.amount_total !== Number(invoice.amount_cents) ||
    session.currency !== invoice.currency ||
    session.metadata?.portal_invoice_id !== invoice.id ||
    session.metadata?.portal_document_id !== invoice.document_id ||
    session.metadata?.portal_amount_cents !== String(invoice.amount_cents)
  )
    throw new Error("Stripe checkout does not match this invoice");
}

const checkoutReservation = z.object({
  id: z.uuid(),
  startedAt: z.iso.datetime(),
  mode: z.enum(["test", "live"]),
  idempotencyKey: z.string().min(1),
  // Store server-generated parameters for an equivalent idempotent recovery.
  params: z.record(z.string(), z.unknown()),
});

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
  const mode = assertProviderRecord(
    Boolean(invoice.demo),
    actor.simulated,
    db.dialect,
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
    if (existing.status === "open" && existing.url) {
      validateCheckout(existing, invoice, mode);
      return existing.url;
    }
    if (existing.status === "complete")
      throw new Error(
        invoice.status === "failed"
          ? "This payment failed. Please contact PBI to arrange another payment."
          : "Payment confirmation is pending. Please refresh the invoice shortly.",
      );
  }
  const attemptId = id();
  const params: Stripe.Checkout.SessionCreateParams = {
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
    payment_intent_data: {
      metadata: {
        portal_invoice_id: invoiceId,
        portal_document_id: String(invoice.document_id),
      },
    },
    success_url: `${origin}/portal/invoices/${invoiceId}?payment=returned`,
    cancel_url: `${origin}/portal/invoices/${invoiceId}?payment=cancelled`,
  };
  const key = `portal-invoice-${invoiceId}-${attemptId}`;
  const reservation = JSON.stringify({
    id: attemptId,
    startedAt: now(),
    mode,
    idempotencyKey: key,
    params,
  });
  const reserved = await db.execute({
    sql: `UPDATE invoices SET checkout_attempt=?,updated_at=? WHERE id=? AND status IN ('open','failed') AND checkout_attempt IS NULL AND ${nullEqual(db.dialect, "stripe_session_id")} AND EXISTS(SELECT 1 FROM documents WHERE documents.id=invoices.document_id AND documents.status='approved')`,
    args: [reservation, now(), invoiceId, invoice.stripe_session_id],
  });
  if (reserved.rowsAffected !== 1)
    throw new Error(
      "Checkout is already opening or this invoice is no longer payable.",
    );
  let session: Stripe.Checkout.Session;
  try {
    session = await provider.checkout.sessions.create(params, {
      idempotencyKey: key,
    });
    validateCheckout(session, invoice, mode);
    if (!session.url) throw new Error("Missing checkout URL");
    const saved = await db.execute({
      sql: "UPDATE invoices SET stripe_session_id=?,checkout_attempt=NULL,updated_at=? WHERE id=? AND checkout_attempt=?",
      args: [session.id, now(), invoiceId, reservation],
    });
    if (saved.rowsAffected !== 1)
      throw new Error("Checkout reservation changed");
  } catch (error) {
    // A timeout/5xx may mean Stripe created a session. Keep its exact request and
    // key reserved so retries cannot expose a second payment opportunity.
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      await db.execute({
        sql: "UPDATE invoices SET checkout_attempt=NULL WHERE id=? AND checkout_attempt=?",
        args: [invoiceId, reservation],
      });
      throw new Error("Unable to open online payment. Please contact PBI.");
    }
    throw new Error(
      "Payment checkout is awaiting confirmation. Please refresh shortly or contact PBI.",
    );
  }
  await audit(
    String(invoice.organization_id),
    String(invoice.project_id),
    actor.userId,
    "invoice.checkout.started",
    { invoiceId, sessionId: session.id, mode },
  );
  return session.url;
}

export class InvalidStripeEvent extends Error {}

export async function acceptStripeEvent(raw: string, signature: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;
  try {
    if (!secret?.startsWith("whsec_") || !signature)
      throw new Error("Missing signature");
    event = stripe().webhooks.constructEvent(raw, signature, secret);
    if (event.livemode !== (portalProviderMode() === "live"))
      throw new Error("Wrong mode");
  } catch {
    throw new InvalidStripeEvent("Invalid Stripe event");
  }
  const db = await portalDb();
  await db.execute({
    sql: "INSERT INTO provider_events (id,provider,event_id,payload_json,received_at) VALUES (?,?,?,?,?) ON CONFLICT(provider,event_id) DO NOTHING",
    args: [id(), "stripe", event.id, raw, now()],
  });
  return event.id;
}

export async function processStripeEvent(eventId: string) {
  const db = await portalDb();
  const tx = await db.transaction("write");
  try {
    const queued = (
      await tx.execute({
        sql: `SELECT * FROM provider_events WHERE provider='stripe' AND event_id=?${db.dialect === "postgres" ? " FOR UPDATE" : ""}`,
        args: [eventId],
      })
    ).rows[0];
    if (!queued) throw new Error("Stripe event not found");
    if (queued.processed_at) {
      await tx.commit();
      return "duplicate";
    }
    const event = JSON.parse(String(queued.payload_json)) as Stripe.Event;
    if (event.livemode !== (portalProviderMode() === "live"))
      throw new Error("Stripe event mode changed");
    let invoice;
    let requestedStatus: string | null = null;
    let intentId: string | null = null;
    if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
      ].includes(event.type)
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.portal_invoice_id;
      // This Stripe account can process unrelated sales; acknowledge those events.
      if (invoiceId) {
        invoice = (
          await tx.execute({
            sql: "SELECT * FROM invoices WHERE id=?",
            args: [invoiceId],
          })
        ).rows[0];
        if (
          !invoice ||
          invoice.stripe_session_id !== session.id ||
          Number(invoice.amount_cents) !== session.amount_total ||
          invoice.currency !== session.currency ||
          session.metadata?.portal_amount_cents !==
            String(invoice.amount_cents) ||
          session.metadata?.portal_document_id !== invoice.document_id
        )
          throw new Error(
            "Stripe invoice/session mismatch or session not saved yet",
          );
        intentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || null;
        requestedStatus =
          event.type === "checkout.session.async_payment_failed"
            ? "failed"
            : event.type === "checkout.session.async_payment_succeeded" ||
                session.payment_status === "paid"
              ? "paid"
              : "processing";
        if (!intentId) throw new Error("Missing payment intent");
        if (
          invoice.stripe_payment_intent_id &&
          invoice.stripe_payment_intent_id !== intentId
        )
          throw new Error("Payment intent mismatch");
      }
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      intentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id || null;
      if (intentId) {
        invoice = (
          await tx.execute({
            sql: "SELECT * FROM invoices WHERE stripe_payment_intent_id=?",
            args: [intentId],
          })
        ).rows[0];
        // A refund can precede its checkout callback. Keep it queued until mapped.
        if (!invoice)
          throw new Error("Refund payment intent is not mapped yet");
        if (
          Number(invoice.amount_cents) !== charge.amount ||
          invoice.currency !== charge.currency ||
          charge.amount_refunded > charge.amount ||
          charge.amount_refunded < 0
        )
          throw new Error("Stripe refund amount mismatch");
        if (charge.amount_refunded > 0)
          requestedStatus =
            charge.amount_refunded === charge.amount
              ? "refunded"
              : "partially_refunded";
      }
    }
    const at = now();
    if (invoice && requestedStatus) {
      const status = nextInvoiceStatus(String(invoice.status), requestedStatus);
      if (status !== invoice.status) {
        const updated = await tx.execute({
          sql: "UPDATE invoices SET status=?,stripe_payment_intent_id=COALESCE(?,stripe_payment_intent_id),updated_at=? WHERE id=? AND status=?",
          args: [status, intentId, at, invoice.id, invoice.status],
        });
        if (updated.rowsAffected !== 1)
          throw new Error("Invoice changed during payment processing");
        await tx.execute({
          sql: "INSERT INTO audit_events VALUES (?,?,?,?,?,?,?)",
          args: [
            id(),
            invoice.organization_id,
            invoice.project_id,
            "stripe",
            `invoice.${status}`,
            JSON.stringify({ invoiceId: invoice.id, eventId }),
            at,
          ],
        });
      }
    }
    await tx.execute({
      sql: "UPDATE provider_events SET processed_at=?,last_error=NULL WHERE id=?",
      args: [at, queued.id],
    });
    await tx.commit();
    return "processed";
  } catch (error) {
    await tx.rollback();
    await db.execute({
      sql: "UPDATE provider_events SET last_error=? WHERE provider='stripe' AND event_id=? AND processed_at IS NULL",
      args: [
        `${now()}: Payment reconciliation pending; retry required`,
        eventId,
      ],
    });
    throw error;
  } finally {
    tx.close();
  }
}

export async function applyStripeEvent(raw: string, signature: string | null) {
  return processStripeEvent(await acceptStripeEvent(raw, signature));
}

export async function retryStripeEvents(limit = 25) {
  const db = await portalDb();
  const events = (
    await db.execute({
      sql: "SELECT event_id FROM provider_events WHERE provider='stripe' AND processed_at IS NULL ORDER BY CASE WHEN last_error IS NULL THEN 0 ELSE 1 END,CASE WHEN last_error LIKE '20%' THEN last_error ELSE received_at END,received_at LIMIT ?",
      args: [limit],
    })
  ).rows;
  let completed = 0;
  for (const event of events) {
    try {
      await processStripeEvent(String(event.event_id));
      completed++;
    } catch {
      /* Durable queue retains errors; never print financial data. */
    }
  }
  const remaining = Number(
    (
      await db.execute(
        "SELECT count(*) AS count FROM provider_events WHERE provider='stripe' AND processed_at IS NULL",
      )
    ).rows[0]?.count || 0,
  );
  return { completed, remaining };
}

export async function recoverStripeCheckouts(limit = 5) {
  const db = await portalDb();
  const invoices = (
    await db.execute({
      sql: "SELECT i.*,d.status AS document_status FROM invoices i JOIN documents d ON d.id=i.document_id WHERE i.checkout_attempt IS NOT NULL ORDER BY i.updated_at LIMIT ?",
      args: [limit],
    })
  ).rows;
  let recovered = 0,
    blocked = 0;
  for (const invoice of invoices) {
    const priorBlocked = blocked;
    try {
      const reservation = checkoutReservation.parse(
        JSON.parse(String(invoice.checkout_attempt)),
      );
      const age = Date.now() - Date.parse(reservation.startedAt);
      if (age < 120_000) continue;
      // Stripe may prune keys after 24h. Never replay older uncertain requests.
      if (
        age >= 23 * 60 * 60 * 1000 ||
        reservation.mode !== portalProviderMode() ||
        !invoiceCanCheckout(String(invoice.status)) ||
        invoice.document_status !== "approved"
      ) {
        blocked++;
        continue;
      }
      const params = reservation.params as Stripe.Checkout.SessionCreateParams;
      if (
        params.metadata?.portal_invoice_id !== invoice.id ||
        params.metadata?.portal_document_id !== invoice.document_id ||
        params.metadata?.portal_amount_cents !== String(invoice.amount_cents) ||
        params.line_items?.[0]?.price_data?.unit_amount !==
          Number(invoice.amount_cents)
      )
        throw new Error("Checkout reservation mismatch");
      const session = await stripe().checkout.sessions.create(params, {
        idempotencyKey: reservation.idempotencyKey,
      });
      validateCheckout(session, invoice, reservation.mode);
      const saved = await db.execute({
        sql: "UPDATE invoices SET stripe_session_id=?,checkout_attempt=NULL,updated_at=? WHERE id=? AND checkout_attempt=?",
        args: [session.id, now(), invoice.id, invoice.checkout_attempt],
      });
      if (saved.rowsAffected === 1) {
        recovered++;
        await audit(
          String(invoice.organization_id),
          String(invoice.project_id),
          "maintenance",
          "invoice.checkout.recovered",
          { invoiceId: invoice.id, sessionId: session.id },
        );
      }
    } catch {
      blocked++;
    } finally {
      // Rotate unresolved reservations through the batch; an old blocked invoice
      // must not prevent recovery of every newer checkout.
      if (blocked > priorBlocked)
        await db.execute({
          sql: "UPDATE invoices SET updated_at=? WHERE id=? AND checkout_attempt=?",
          args: [now(), invoice.id, invoice.checkout_attempt],
        });
    }
  }
  return { recovered, blocked };
}
