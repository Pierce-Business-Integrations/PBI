import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { parseProjectDetails } from "../src/lib/portal/schema";
import { renderPortalDocument } from "../src/lib/portal/documents";
import { invoiceCanCheckout } from "../src/lib/portal/payment-status";
import { projectFocus } from "../src/lib/portal/project-focus";

const fixture = async () =>
  JSON.parse(
    await readFile(
      join(process.cwd(), "docs", "client-portal", "example-project.json"),
      "utf8",
    ),
  );

test("valid example and commercial validation", async () => {
  const value = await fixture();
  assert.equal(parseProjectDetails(value).pricing.amountCents, 250000);
  assert.throws(
    () =>
      parseProjectDetails({
        ...value,
        paymentSchedule: [{ label: "Wrong", amountCents: 1, due: "Today" }],
      }),
    /Fixed-price schedule/,
  );
  assert.throws(
    () => parseProjectDetails({ ...value, exclusions: [] }),
    /too_small/,
  );
  assert.throws(
    () => parseProjectDetails({ ...value, contactEmail: "bad" }),
    /invalid_format/,
  );
});

test("checkout is unavailable while a payment is processing or settled", () => {
  assert.equal(invoiceCanCheckout("open"), true);
  assert.equal(invoiceCanCheckout("failed"), true);
  for (const status of [
    "processing",
    "paid",
    "partially_refunded",
    "refunded",
    "voided",
  ])
    assert.equal(invoiceCanCheckout(status), false);
});

test("project guidance reflects real signing and payment states", () => {
  const document = { id: "invoice-doc", kind: "invoice", status: "approved" };
  const base = {
    documents: [document],
    invoices: [{ documentId: document.id, status: "open" }],
    signing: [] as { documentId: string; status: string }[],
    admin: false,
    simulated: false,
  };
  assert.match(projectFocus(base).title, /ready for payment/);
  assert.equal(projectFocus(base).href, "#document-invoice-doc");
  assert.match(
    projectFocus({
      ...base,
      invoices: [{ documentId: document.id, status: "processing" }],
    }).title,
    /confirmation is pending/,
  );
  assert.match(
    projectFocus({
      ...base,
      invoices: [],
      signing: [{ documentId: "agreement-doc", status: "simulated_pending" }],
      simulated: true,
    }).description,
    /Signing is not available yet/,
  );
  assert.match(
    projectFocus({
      ...base,
      documents: [
        { id: "agreement-doc", kind: "agreement", status: "approved" },
      ],
      invoices: [],
    }).description,
    /Signing will appear/,
  );
  assert.match(
    projectFocus({
      ...base,
      invoices: [
        {
          documentId: document.id,
          status: "open",
        },
      ],
      simulated: true,
    }).description,
    /Online payment is not available yet/,
  );
});

test("short and long proposals plus agreement and invoice render as valid PDFs", async () => {
  const short = parseProjectDetails(await fixture());
  const shortPdf = await PDFDocument.load(
    await renderPortalDocument("proposal", short, 1),
  );
  assert.ok(shortPdf.getPageCount() >= 2);
  const long = parseProjectDetails({
    ...short,
    scope: Array.from({ length: 35 }, (_, i) => ({
      heading: `Workstream ${i + 1}`,
      description:
        "Review the workflow and implement the agreed improvements. ".repeat(8),
    })),
  });
  const longPdf = await PDFDocument.load(
    await renderPortalDocument("proposal", long, 2),
  );
  assert.ok(longPdf.getPageCount() > shortPdf.getPageCount());
  const agreement = await PDFDocument.load(
    await renderPortalDocument("agreement", short, 1),
  );
  assert.ok(agreement.getPageCount() >= 4);
  const invoice = await PDFDocument.load(
    await renderPortalDocument("invoice", short, 1, {
      number: "DEMO-001",
      amountCents: 250000,
      due: "2026-10-30",
    }),
  );
  assert.ok(invoice.getPageCount() >= 2);
  for (const pdf of [shortPdf, longPdf, agreement, invoice])
    for (const page of pdf.getPages())
      assert.deepEqual(page.getSize(), { width: 612, height: 792 });
});
