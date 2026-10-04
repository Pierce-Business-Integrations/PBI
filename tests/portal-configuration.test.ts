import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertClientProjectAccess,
  assertProviderRecord,
  portalProviderMode,
} from "../src/lib/portal/configuration";
import { emptyProjectDraft } from "../src/lib/portal/project-draft";
import { nextInvoiceStatus } from "../src/lib/portal/payment-status";

test("client and provider modes cannot turn example records or local actors into live clients", () => {
  const mode = process.env.PORTAL_PROVIDER_MODE,
    clients = process.env.PORTAL_ALLOW_CLIENT_PROJECTS;
  try {
    delete process.env.PORTAL_PROVIDER_MODE;
    delete process.env.PORTAL_ALLOW_CLIENT_PROJECTS;
    assert.equal(portalProviderMode(), "test");
    assert.equal(assertProviderRecord(true, true, "sqlite"), "test");
    assert.throws(
      () => assertProviderRecord(false, false, "postgres"),
      /example project/,
    );
    assert.throws(
      () => assertClientProjectAccess(false, "postgres"),
      /Enable client/,
    );
    process.env.PORTAL_ALLOW_CLIENT_PROJECTS = "true";
    process.env.PORTAL_PROVIDER_MODE = "live";
    assert.equal(assertProviderRecord(false, false, "postgres"), "live");
    assert.throws(
      () => assertProviderRecord(true, false, "postgres"),
      /Example projects/,
    );
    assert.throws(
      () => assertProviderRecord(false, true, "postgres"),
      /hosted owner/,
    );
    assert.throws(
      () => assertProviderRecord(false, false, "sqlite"),
      /hosted owner/,
    );
    process.env.PORTAL_PROVIDER_MODE = "typo";
    assert.throws(portalProviderMode, /must be test or live/);
  } finally {
    if (mode === undefined) delete process.env.PORTAL_PROVIDER_MODE;
    else process.env.PORTAL_PROVIDER_MODE = mode;
    if (clients === undefined) delete process.env.PORTAL_ALLOW_CLIENT_PROJECTS;
    else process.env.PORTAL_ALLOW_CLIENT_PROJECTS = clients;
  }
});
test("new client drafts do not import illustrative GoToHearing commercial terms", () => {
  const draft = emptyProjectDraft();
  assert.equal(draft.demo, false);
  assert.equal(draft.organizationName, "");
  assert.equal(draft.pricing.amountCents, 0);
  assert.equal(draft.terms.length, 0);
  assert.ok(
    draft.scope.every((item) => item.heading === "" && item.description === ""),
  );
  assert.equal(draft.paymentSchedule.length, 0);
});
test("payment states resist delayed settlement and refund callbacks", () => {
  assert.equal(nextInvoiceStatus("paid", "processing"), "paid");
  assert.equal(nextInvoiceStatus("refunded", "partially_refunded"), "refunded");
  assert.equal(
    nextInvoiceStatus("partially_refunded", "paid"),
    "partially_refunded",
  );
  assert.equal(nextInvoiceStatus("failed", "processing"), "failed");
  assert.equal(nextInvoiceStatus("failed", "paid"), "paid");
  assert.throws(() => nextInvoiceStatus("voided", "paid"), /Voided/);
});
