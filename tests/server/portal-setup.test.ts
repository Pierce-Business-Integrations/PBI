import assert from "node:assert/strict";
import { test } from "node:test";
import { portalSetupReport } from "../../src/lib/portal/readiness";
import { validMaintenanceToken } from "../../src/lib/portal/maintenance";

test("owner setup reports configuration names without exposing secret values", async () => {
  process.env.PORTAL_PROVIDER_MODE = "test";
  for (const name of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_DB_URL",
    "PORTAL_ADMIN_USER_ID",
    "SIGNWELL_API_KEY",
    "SIGNWELL_WEBHOOK_ID",
    "PBI_SIGNER_EMAIL",
    "PBI_SIGNER_NAME",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "CRON_SECRET",
  ])
    delete process.env[name];
  const missing = await portalSetupReport(true);
  assert.ok(missing.checks.every((check) => check.status === "missing"));
  process.env.STRIPE_SECRET_KEY = "sk_live_PRIVATE_VALUE_DO_NOT_DISPLAY";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_PRIVATE_VALUE_DO_NOT_DISPLAY";
  process.env.SIGNWELL_API_KEY = "PRIVATE_VALUE_DO_NOT_DISPLAY";
  process.env.CRON_SECRET = "PRIVATE_VALUE_DO_NOT_DISPLAY";
  const configured = await portalSetupReport();
  assert.equal(
    configured.checks.find((check) => check.id === "stripe")?.status,
    "failed",
  );
  assert.equal(
    configured.checks.find((check) => check.id === "maintenance")?.status,
    "failed",
  );
  assert.ok(
    !JSON.stringify(configured).includes("PRIVATE_VALUE_DO_NOT_DISPLAY"),
  );
});
test("scheduled recovery rejects missing, malformed, weak, and wrong bearer tokens", () => {
  delete process.env.CRON_SECRET;
  assert.equal(validMaintenanceToken(null), false);
  process.env.CRON_SECRET = "weak";
  assert.equal(validMaintenanceToken("Bearer weak"), false);
  process.env.CRON_SECRET = "test-secret-with-at-least-thirty-two-characters";
  assert.equal(validMaintenanceToken("Bearer wrong"), false);
  assert.equal(
    validMaintenanceToken(
      "Basic test-secret-with-at-least-thirty-two-characters",
    ),
    false,
  );
  assert.equal(
    validMaintenanceToken(
      "Bearer test-secret-with-at-least-thirty-two-characters",
    ),
    true,
  );
});
