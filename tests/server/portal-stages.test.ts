import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mock, test } from "node:test";
import Stripe from "stripe";
import type { StageInput } from "../../src/lib/portal/stages";

test("stage persistence isolates clients, protects issued invoices, and rejects stale edits", async () => {
  // This suite always uses its own in-memory database and cannot touch local or hosted projects.
  process.env.PORTAL_DATABASE_URL = "file::memory:";
  const { portalDb, id, now } = await import("../../src/lib/portal/db");
  const {
    createDocument,
    createProject,
    getProjectBundle,
    getInvoiceBundle,
    linkStageInvoice,
    saveStagePlan,
    voidInvoice,
  } = await import("../../src/lib/portal/repository");
  const db = await portalDb();
  const { checkoutInvoice } = await import("../../src/lib/portal/payments");
  const owner = { userId: "test-owner", simulated: true };
  const clientA = { userId: "test-client-a", simulated: true };
  const clientB = { userId: "test-client-b", simulated: true };
  try {
    const org = id();
    await db.execute({
      sql: "INSERT INTO organizations VALUES (?,?,?,?)",
      args: [org, "Test owner", 1, now()],
    });
    await db.execute({
      sql: "INSERT INTO memberships VALUES (?,?,?,?,?)",
      args: [id(), org, owner.userId, "admin", now()],
    });
    const fixture = JSON.parse(
      await readFile("docs/client-portal/example-project.json", "utf8"),
    );
    const projectA = await createProject(owner, fixture);
    const projectB = await createProject(owner, {
      ...fixture,
      projectName: "Isolated test",
    });
    for (const [projectId, actor] of [
      [projectA, clientA],
      [projectB, clientB],
    ] as const) {
      const project = (await getProjectBundle(projectId, owner))!;
      await db.execute({
        sql: "INSERT INTO memberships VALUES (?,?,?,?,?)",
        args: [
          id(),
          project.project.organization_id,
          actor.userId,
          "client",
          now(),
        ],
      });
    }
    const stages: StageInput[] = [
      {
        id: id(),
        title: "Discovery",
        description: "Review workflows",
        deliverables: ["Priorities"],
        status: "complete",
      },
      {
        id: id(),
        title: "Solution design",
        description: "Define the solution",
        deliverables: ["Solution plan"],
        status: "in_progress",
      },
    ];
    await saveStagePlan(owner, projectA, { version: 1, stages });
    assert.equal(
      (await getProjectBundle(projectA, clientA))?.stages[1].status,
      "in_progress",
    );
    await assert.rejects(
      () => saveStagePlan(clientA, projectA, { version: 2, stages }),
      /Admin access/,
    );
    await assert.rejects(
      () => saveStagePlan(owner, projectA, { version: 1, stages }),
      /stage plan changed/,
    );
    await assert.rejects(
      () => saveStagePlan(owner, projectB, { version: 1, stages }),
      /Stage not found/,
    );
    assert.equal((await getProjectBundle(projectB, owner))?.stages.length, 0);
    assert.equal(
      (await getProjectBundle(projectA, owner))?.stages[1].status,
      "in_progress",
    );
    await assert.rejects(
      () =>
        createDocument(owner, projectB, "invoice", {
          amountCents: 50000,
          due: "2026-10-16",
          stageId: stages[1].id,
        }),
      /Stage not found/,
    );
    const created = await createDocument(owner, projectA, "invoice", {
      amountCents: 50000,
      due: "2026-10-16",
      stageId: stages[1].id,
    });
    assert.equal(
      (await getProjectBundle(projectA, clientA))?.invoices.length,
      0,
    );
    assert.equal(await getInvoiceBundle(clientA, created.invoiceId!), null);
    await db.execute({
      sql: "UPDATE documents SET status='approved' WHERE id=?",
      args: [created.documentId],
    });
    assert.equal(
      (await getInvoiceBundle(clientA, created.invoiceId!))?.invoice.status,
      "open",
    );
    assert.equal(await getInvoiceBundle(clientB, created.invoiceId!), null);
    assert.equal(await getProjectBundle(projectA, clientB), null);
    await assert.rejects(
      () =>
        createDocument(owner, projectA, "invoice", {
          amountCents: 50000,
          due: "2026-10-16",
          stageId: stages[1].id,
        }),
      /already has an invoice/,
    );
    const other = await createDocument(owner, projectB, "invoice", {
      amountCents: 50000,
      due: "2026-10-16",
    });
    await assert.rejects(
      () => linkStageInvoice(owner, projectA, stages[0].id, other.invoiceId!),
      /not found in this project/,
    );
    await assert.rejects(
      () => linkStageInvoice(clientA, projectA, stages[0].id, other.invoiceId!),
      /Admin access/,
    );
    await saveStagePlan(owner, projectA, {
      version: 2,
      stages: stages.map((stage) => ({
        ...stage,
        title:
          stage.title === "Solution design" ? "Renamed stage" : stage.title,
        status: "complete",
      })),
    });
    const invoice = (await getInvoiceBundle(clientA, created.invoiceId!))!;
    assert.equal(
      invoice.invoice.status,
      "open",
      "Completing work must never mark an invoice paid",
    );
    assert.equal(
      invoice.invoice.stage_title,
      "Solution design",
      "The invoice keeps its original stage title",
    );
    await assert.rejects(
      () => saveStagePlan(owner, projectA, { version: 3, stages: [stages[0]] }),
      /invoice history cannot be removed/,
    );
    assert.equal(
      (await getProjectBundle(projectA, owner))?.stages.length,
      2,
      "Rejected edits must roll back",
    );
    await assert.rejects(
      () => voidInvoice(clientA, created.invoiceId!),
      /Admin access/,
    );
    for (const status of ["processing", "paid", "refunded"]) {
      await db.execute({
        sql: "UPDATE invoices SET status=? WHERE id=?",
        args: [status, created.invoiceId!],
      });
      await assert.rejects(
        () => voidInvoice(owner, created.invoiceId!),
        /Only an unpaid invoice/,
      );
    }
    await db.execute({
      sql: "UPDATE invoices SET status='open',stripe_session_id='cs_test_active' WHERE id=?",
      args: [created.invoiceId!],
    });
    await assert.rejects(
      () => voidInvoice(owner, created.invoiceId!),
      /Only an unpaid invoice/,
    );
    await db.execute({
      sql: "UPDATE invoices SET stripe_session_id=NULL WHERE id=?",
      args: [created.invoiceId!],
    });
    await db.execute({
      sql: "UPDATE invoices SET checkout_attempt='opening' WHERE id=?",
      args: [created.invoiceId!],
    });
    await assert.rejects(
      () => voidInvoice(owner, created.invoiceId!),
      /Only an unpaid invoice/,
    );
    await db.execute({
      sql: "UPDATE invoices SET checkout_attempt=NULL WHERE id=?",
      args: [created.invoiceId!],
    });
    await voidInvoice(owner, created.invoiceId!);
    assert.equal(
      (await getInvoiceBundle(clientA, created.invoiceId!))?.invoice.status,
      "voided",
    );
    const replacement = await createDocument(owner, projectA, "invoice", {
      amountCents: 50000,
      due: "2026-10-16",
      stageId: stages[1].id,
    });
    assert.notEqual(replacement.invoiceId, created.invoiceId);
    await db.execute({
      sql: "UPDATE documents SET status='approved' WHERE id=?",
      args: [replacement.documentId],
    });
    const originalKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = "sk_test_isolated_no_network";
    const sdk = new Stripe(process.env.STRIPE_SECRET_KEY);
    const prototype = Object.getPrototypeOf(sdk.checkout.sessions);
    let started!: () => void;
    let finish!: () => void;
    const creating = new Promise<void>((resolve) => {
      started = resolve;
    });
    const release = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const createMock = mock.method(
      prototype,
      "create",
      async (params: Stripe.Checkout.SessionCreateParams) => {
        assert.equal(params.line_items?.[0]?.price_data?.unit_amount, 50000);
        assert.equal(params.metadata?.portal_invoice_id, replacement.invoiceId);
        started();
        await release;
        return {
          id: "cs_test_reserved",
          mode: "payment",
          livemode: false,
          amount_total: 50000,
          currency: "usd",
          metadata: params.metadata,
          url: "https://checkout.example.test/session",
          status: "open",
        };
      },
    );
    const retrieveMock = mock.method(prototype, "retrieve", async () => ({
      id: "cs_test_reserved",
      status: "complete",
      url: null,
    }));
    try {
      const opening = checkoutInvoice(
        clientA,
        replacement.invoiceId!,
        "https://client.example.test",
      );
      await creating;
      await assert.rejects(
        () =>
          checkoutInvoice(
            clientA,
            replacement.invoiceId!,
            "https://client.example.test",
          ),
        /already opening/,
      );
      await assert.rejects(
        () => voidInvoice(owner, replacement.invoiceId!),
        /Only an unpaid invoice/,
      );
      finish();
      assert.equal(await opening, "https://checkout.example.test/session");
      assert.equal(
        (await getInvoiceBundle(clientA, replacement.invoiceId!))?.invoice
          .status,
        "open",
        "Checkout creation never confirms payment",
      );
      await assert.rejects(
        () =>
          checkoutInvoice(
            clientA,
            replacement.invoiceId!,
            "https://client.example.test",
          ),
        /confirmation is pending/,
      );
      assert.equal(
        createMock.mock.callCount(),
        1,
        "A completed session awaiting its webhook must not create another charge opportunity",
      );
    } finally {
      finish();
      createMock.mock.restore();
      retrieveMock.mock.restore();
      if (originalKey === undefined) delete process.env.STRIPE_SECRET_KEY;
      else process.env.STRIPE_SECRET_KEY = originalKey;
    }
  } finally {
    db.close();
  }
});
