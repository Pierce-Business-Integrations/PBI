import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mock, test } from "node:test";
import Stripe from "stripe";

test("Stripe verifies, persists, and safely recovers payment events and checkout requests", async (t) => {
  process.env.PORTAL_DATABASE_URL = "file::memory:";
  delete process.env.SUPABASE_DB_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.PORTAL_PROVIDER_MODE = "test";
  process.env.STRIPE_SECRET_KEY = "sk_test_isolated_no_network";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_isolated_test";
  const sdk = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { portalDb, id, now } = await import("../../src/lib/portal/db");
  const { createProject, createDocument, approveDocument } =
    await import("../../src/lib/portal/repository");
  const {
    applyStripeEvent,
    acceptStripeEvent,
    retryStripeEvents,
    checkoutInvoice,
    recoverStripeCheckouts,
  } = await import("../../src/lib/portal/payments");
  const db = await portalDb();
  const actor = { userId: "test-owner", simulated: true };
  // Any unmocked provider call fails, even if a developer has real keys elsewhere.
  const network = mock.method(globalThis, "fetch", async () => {
    throw new Error("Network prohibited in isolated tests");
  });
  const org = id();
  await db.execute({
    sql: "INSERT INTO organizations VALUES (?,?,?,?)",
    args: [org, "Isolated owner", 1, now()],
  });
  await db.execute({
    sql: "INSERT INTO memberships VALUES (?,?,?,?,?)",
    args: [id(), org, actor.userId, "admin", now()],
  });
  const fixture = JSON.parse(
    await readFile("docs/client-portal/example-project.json", "utf8"),
  );
  const project = await createProject(actor, fixture);
  const invoice = await createDocument(actor, project, "invoice", {
    amountCents: 50000,
    due: "2026-10-20",
  });
  await approveDocument(actor, invoice.documentId);
  const invoiceId = invoice.invoiceId!;
  const session = {
    id: "cs_test_main",
    amount_total: 50000,
    currency: "usd",
    payment_status: "unpaid",
    payment_intent: "pi_test_main",
    metadata: {
      portal_invoice_id: invoiceId,
      portal_document_id: invoice.documentId,
      portal_amount_cents: "50000",
    },
  };
  const event = (
    type: string,
    object: unknown,
    eventId = id(),
    live = false,
  ) => ({
    id: eventId,
    object: "event",
    type,
    livemode: live,
    created: Math.floor(Date.now() / 1000),
    data: { object },
  });
  const signed = (value: unknown) => {
    const raw = JSON.stringify(value);
    return {
      raw,
      signature: sdk.webhooks.generateTestHeaderString({
        payload: raw,
        secret: process.env.STRIPE_WEBHOOK_SECRET!,
      }),
    };
  };
  const deliver = (value: unknown) => {
    const input = signed(value);
    return applyStripeEvent(input.raw, input.signature);
  };
  const state = async () =>
    (
      await db.execute({
        sql: "SELECT * FROM invoices WHERE id=?",
        args: [invoiceId],
      })
    ).rows[0];
  try {
    await t.test(
      "forged and wrong-mode events never enter the queue",
      async () => {
        const input = signed(event("checkout.session.completed", session));
        await assert.rejects(
          () => acceptStripeEvent(input.raw, "t=1,v1=forged"),
          /Invalid Stripe/,
        );
        await assert.rejects(
          () =>
            deliver(event("checkout.session.completed", session, id(), true)),
          /Invalid Stripe/,
        );
        assert.equal(
          (await db.execute("SELECT count(*) AS count FROM provider_events"))
            .rows[0].count,
          0,
        );
      },
    );
    await t.test(
      "callbacks arriving before checkout is saved remain durable and retry",
      async () => {
        const input = event("checkout.session.completed", session);
        await assert.rejects(() => deliver(input), /session not saved yet/);
        const queued = (
          await db.execute({
            sql: "SELECT * FROM provider_events WHERE event_id=?",
            args: [input.id],
          })
        ).rows[0];
        assert.equal(queued.processed_at, null);
        assert.ok(queued.last_error);
        await db.execute({
          sql: "UPDATE invoices SET stripe_session_id=? WHERE id=?",
          args: [session.id, invoiceId],
        });
        assert.deepEqual(await retryStripeEvents(), {
          completed: 1,
          remaining: 0,
        });
        assert.equal(
          (await state()).status,
          "processing",
          "Starting ACH does not settle an invoice",
        );
        assert.equal(await deliver(input), "duplicate");
        assert.equal(
          (
            await db.execute(
              "SELECT count(*) AS count FROM audit_events WHERE action='invoice.processing'",
            )
          ).rows[0].count,
          1,
        );
      },
    );
    await t.test(
      "failed ACH, late callbacks, paid settlement, and refunds remain monotonic",
      async () => {
        await deliver(event("checkout.session.async_payment_failed", session));
        assert.equal((await state()).status, "failed");
        await deliver(event("checkout.session.completed", session));
        assert.equal((await state()).status, "failed");
        await deliver(
          event("checkout.session.async_payment_succeeded", {
            ...session,
            payment_status: "paid",
          }),
        );
        assert.equal((await state()).status, "paid");
        await deliver(event("checkout.session.async_payment_failed", session));
        assert.equal((await state()).status, "paid");
        const charge = {
          id: "ch_test_main",
          payment_intent: session.payment_intent,
          amount: 50000,
          currency: "usd",
          amount_refunded: 10000,
        };
        await deliver(event("charge.refunded", charge));
        assert.equal((await state()).status, "partially_refunded");
        await deliver(
          event("charge.refunded", { ...charge, amount_refunded: 50000 }),
        );
        await deliver(event("charge.refunded", charge));
        assert.equal(
          (await state()).status,
          "refunded",
          "A late partial refund cannot undo a full refund",
        );
      },
    );
    await t.test(
      "invoice versions, amounts, currency, and session identifiers must match",
      async () => {
        for (const change of [
          { amount_total: 1 },
          { currency: "eur" },
          { id: "cs_other" },
          {
            metadata: {
              ...session.metadata,
              portal_document_id: "another-version",
            },
          },
        ])
          await assert.rejects(
            () =>
              deliver(
                event("checkout.session.completed", { ...session, ...change }),
              ),
            /mismatch/,
          );
        assert.equal((await state()).status, "refunded");
      },
    );
    await t.test(
      "unrelated account sales are acknowledged without changing invoices",
      async () => {
        assert.equal(
          await deliver(
            event("checkout.session.completed", { ...session, metadata: {} }),
          ),
          "processed",
        );
        assert.equal((await state()).status, "refunded");
      },
    );
    await t.test(
      "uncertain checkout retries reuse exact parameters and key, then stop before key expiry",
      async () => {
        const pending = await createDocument(actor, project, "invoice", {
          amountCents: 65000,
          due: "2026-10-21",
        });
        await approveDocument(actor, pending.documentId);
        const prototype = Object.getPrototypeOf(sdk.checkout.sessions);
        let originalParams: unknown, originalKey: unknown;
        const fail = mock.method(
          prototype,
          "create",
          async (params: unknown, options: { idempotencyKey: string }) => {
            originalParams = params;
            originalKey = options.idempotencyKey;
            throw new Error("Uncertain provider timeout");
          },
        );
        await assert.rejects(
          () =>
            checkoutInvoice(
              actor,
              pending.invoiceId!,
              "https://client.example.test",
            ),
          /awaiting confirmation/,
        );
        await assert.rejects(
          () =>
            checkoutInvoice(
              actor,
              pending.invoiceId!,
              "https://client.example.test",
            ),
          /already opening/,
        );
        assert.equal(fail.mock.callCount(), 1);
        fail.mock.restore();
        const row = (
          await db.execute({
            sql: "SELECT * FROM invoices WHERE id=?",
            args: [pending.invoiceId!],
          })
        ).rows[0];
        const reservation = JSON.parse(String(row.checkout_attempt));
        const recover = mock.method(
          prototype,
          "create",
          async (params: unknown, options: { idempotencyKey: string }) => {
            assert.deepEqual(params, originalParams);
            assert.equal(options.idempotencyKey, originalKey);
            return {
              id: "cs_test_recovered",
              mode: "payment",
              livemode: false,
              amount_total: 65000,
              currency: "usd",
              metadata: (params as Stripe.Checkout.SessionCreateParams)
                .metadata,
              status: "open",
              url: "https://checkout.example.test/recovered",
            };
          },
        );
        try {
          reservation.startedAt = new Date(
            Date.now() - 25 * 60 * 60 * 1000,
          ).toISOString();
          await db.execute({
            sql: "UPDATE invoices SET checkout_attempt=? WHERE id=?",
            args: [JSON.stringify(reservation), pending.invoiceId!],
          });
          assert.deepEqual(await recoverStripeCheckouts(), {
            recovered: 0,
            blocked: 1,
          });
          assert.equal(
            recover.mock.callCount(),
            0,
            "Old reservations require manual provider verification",
          );
          reservation.startedAt = new Date(
            Date.now() - 3 * 60 * 1000,
          ).toISOString();
          await db.execute({
            sql: "UPDATE invoices SET checkout_attempt=? WHERE id=?",
            args: [JSON.stringify(reservation), pending.invoiceId!],
          });
          assert.deepEqual(await recoverStripeCheckouts(), {
            recovered: 1,
            blocked: 0,
          });
          const saved = (
            await db.execute({
              sql: "SELECT * FROM invoices WHERE id=?",
              args: [pending.invoiceId!],
            })
          ).rows[0];
          assert.equal(saved.stripe_session_id, "cs_test_recovered");
          assert.equal(saved.checkout_attempt, null);
          assert.equal(
            saved.status,
            "open",
            "Recovery never pretends a checkout is paid",
          );
        } finally {
          recover.mock.restore();
        }
      },
    );
  } finally {
    network.mock.restore();
    db.close();
  }
});
