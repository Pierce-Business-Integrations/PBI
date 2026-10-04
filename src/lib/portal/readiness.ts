import "server-only";
import Stripe from "stripe";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { portalDb } from "./db";
import { clientProjectsEnabled, portalProviderMode } from "./configuration";

export type SetupCheck = {
  id: string;
  name: string;
  status: "missing" | "configured" | "verified" | "failed";
  detail: string;
  variables: string[];
};
export type SetupReport = {
  mode: "test" | "live";
  clientProjects: boolean;
  checkedAt: string;
  checks: SetupCheck[];
};
const groups = [
  [
    "supabase",
    "Supabase accounts and database",
    [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_SECRET_KEY",
      "SUPABASE_DB_URL",
      "PORTAL_ADMIN_USER_ID",
    ],
  ],
  [
    "signwell",
    "SignWell signatures",
    [
      "SIGNWELL_API_KEY",
      "SIGNWELL_WEBHOOK_ID",
      "PBI_SIGNER_EMAIL",
      "PBI_SIGNER_NAME",
    ],
  ],
  ["stripe", "Stripe payments", ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]],
  ["maintenance", "Provider recovery job", ["CRON_SECRET"]],
] as const;

export async function portalSetupReport(verify = false): Promise<SetupReport> {
  const mode = portalProviderMode();
  const checks: SetupCheck[] = groups.map(([id, name, variables]) => {
    const missing = variables.filter(
      (variable) => !process.env[variable]?.trim(),
    );
    return {
      id,
      name,
      variables: [...variables],
      status: missing.length ? "missing" : "configured",
      detail: missing.length
        ? `Set ${missing.join(", ")}.`
        : "Configuration supplied. The connection has not been checked.",
    };
  });
  const stripeCheck = checks.find((check) => check.id === "stripe")!;
  if (
    stripeCheck.status === "configured" &&
    !process.env.STRIPE_SECRET_KEY?.startsWith(
      mode === "test" ? "sk_test_" : "sk_live_",
    )
  ) {
    stripeCheck.status = "failed";
    stripeCheck.detail = `Use a Stripe ${mode}-mode key that matches PORTAL_PROVIDER_MODE.`;
  }
  const maintenance = checks.find((check) => check.id === "maintenance")!;
  if (maintenance.status === "configured") {
    if ((process.env.CRON_SECRET?.length ?? 0) < 32) {
      maintenance.status = "failed";
      maintenance.detail =
        "Use a private recovery secret with at least 32 characters.";
    } else
      maintenance.detail =
        "Secret supplied. Schedule the protected endpoint on your hosting platform.";
  }
  if (verify)
    await Promise.all(
      checks
        .filter(
          (check) =>
            check.status === "configured" && check.id !== "maintenance",
        )
        .map(async (check) => {
          try {
            if (check.id === "supabase") {
              const ownerId = z.uuid().parse(process.env.PORTAL_ADMIN_USER_ID);
              const supabase = supabaseAdmin();
              const db = await portalDb();
              if (db.dialect !== "postgres")
                throw new Error("Hosted database required");
              const [identity, storage, membership, privacy] =
                await Promise.all([
                  supabase.auth.admin.getUserById(ownerId),
                  supabase.storage.getBucket("portal-documents"),
                  db.execute({
                    sql: "SELECT 1 FROM memberships WHERE user_id=? AND role='admin'",
                    args: [ownerId],
                  }),
                  db.execute(
                    "SELECT count(*) AS unsafe FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='pbi_portal' AND c.relkind='r' AND (NOT c.relrowsecurity OR has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE') OR has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE'))",
                  ),
                ]);
              if (
                identity.error ||
                !identity.data.user?.email_confirmed_at ||
                storage.error ||
                storage.data?.public !== false ||
                !membership.rows.length ||
                Number(privacy.rows[0]?.unsafe) !== 0
              )
                throw new Error(
                  "Owner, schema, or private storage needs setup",
                );
              check.detail =
                "Verified owner identity, owner membership, private database tables, and private document bucket. SMTP, invite redemption, and backup restoration still need workflow checks.";
            } else if (check.id === "signwell") {
              const response = await fetch(
                "https://www.signwell.com/api/v1/hooks",
                {
                  headers: { "X-Api-Key": process.env.SIGNWELL_API_KEY! },
                  cache: "no-store",
                  signal: AbortSignal.timeout(10_000),
                },
              );
              if (!response.ok) throw new Error("SignWell connection failed");
              const value = await response.json();
              const hooks = Array.isArray(value)
                ? value
                : (value.hooks ?? value.data ?? []);
              const hook =
                Array.isArray(hooks) &&
                hooks.find(
                  (item: { id?: string; callback_url?: string }) =>
                    item.id === process.env.SIGNWELL_WEBHOOK_ID,
                );
              if (
                !hook ||
                hook.callback_url !==
                  "https://client.piercebusinessintegrations.com/api/portal/webhooks/signwell"
              )
                throw new Error("Signing callback needs setup");
              check.detail =
                "Verified API access and the client-domain webhook. Embedded signing, field placement, and completed PDF retrieval still require a sandbox agreement.";
            } else {
              const provider = new Stripe(process.env.STRIPE_SECRET_KEY!, {
                timeout: 10_000,
                maxNetworkRetries: 0,
              });
              const [balance, endpoints] = await Promise.all([
                provider.balance.retrieve(),
                provider.webhookEndpoints.list({ limit: 100 }),
              ]);
              const required = [
                "checkout.session.completed",
                "checkout.session.async_payment_succeeded",
                "checkout.session.async_payment_failed",
                "charge.refunded",
              ];
              const endpoint = endpoints.data.find(
                (item) =>
                  item.status === "enabled" &&
                  item.url ===
                    "https://client.piercebusinessintegrations.com/api/portal/webhooks/stripe",
              );
              if (
                balance.livemode !== (mode === "live") ||
                !endpoint ||
                !required.every(
                  (event) =>
                    endpoint.enabled_events.includes("*") ||
                    (endpoint.enabled_events as string[]).includes(event),
                )
              )
                throw new Error("Payment callback needs setup");
              check.detail =
                "Verified Stripe API access, mode, and required webhook subscriptions. A signed test webhook and card/ACH payment still require sandbox verification.";
            }
            check.status = "verified";
          } catch {
            check.status = "failed";
            check.detail = `Connection verification failed. Check ${check.name.toLowerCase()}, applied migrations, owner access, and callback configuration in SETUP.md. No raw provider errors or secrets are displayed.`;
          }
        }),
    );
  return {
    mode,
    clientProjects: clientProjectsEnabled(),
    checkedAt: new Date().toISOString(),
    checks,
  };
}
