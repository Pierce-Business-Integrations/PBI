# PBI portal setup

Use **one production Supabase project**, SignWell embedded signing, and Stripe. There is no separate hosted beta database. The October 4 working checkout is `C:\Websites\PBI` on `master`; earlier portal work was on `beta`. Hosted infrastructure and real-client rollout are separate steps. Test mode remains the default. Live capabilities are explicitly gated and have not been enabled, exercised, or deployed.

## Setup dashboard and order

Sign in as owner and open `/portal/settings`, or run `npm run portal:check`. The dashboard lists missing environment-variable names without displaying their values. **Verify connections** performs read-only account/database checks; it does not send invitations, signing requests, or payments. `npm run portal:check -- --verify` runs the same probes from the terminal. A missing/failed check exits with code 1 deliberately.

Set up Supabase first, including the migration, private bucket, verified owner membership, invitation-only Auth, and SMTP. Then configure SignWell and Stripe with test credentials and complete the acceptance workflow below. Do not paste secrets into chat. All portal CLI commands load `.env.local` using the same environment conventions as Next.

## Local preview

1. Run `npm install`, then `npm run dev -- --port 3000` (or your existing preview port).
2. Leave Supabase variables blank to retain the existing ignored `.data/portal.sqlite` preview. Visit `/sign-in?switch=1` to choose Owner, Client A, or Client B. The local identity route is disabled when any hosted Supabase configuration is present and in production.
3. Owner can edit structured project data, generate proposals/agreements/invoices, review and approve exact PDF versions, manage stages, and issue stage invoices. Clients see only their organizations and shared documents. `/sign-up` returns to `/clients`; there is no public registration.
4. No credentials means no provider signing or payment. A local signing record remains distinct from a signed agreement and produces no signed PDF. The client UI contains no development banners.
5. Run `npm test`, `npm run test:portal-repository`, `npm run lint`, `npm run typecheck`, and `npm run build`. Tests use isolated in-memory databases and mocked provider responses, not this preview or hosted records.

Keep `.data/` intact to preserve the current example invoices and stages. No preview data or development memberships are automatically copied to Supabase.

## One hosted Supabase project

1. Create one hosted Supabase project for PBI. Keep keys in `.env.local` and the production deployment's environment settings; never commit them. See the variable names in `.env.example`.
2. Copy the project URL and publishable key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Set the server secret/service-role key as `SUPABASE_SECRET_KEY`. It is used only on the server for identity administration and private Storage.
3. Copy **Connect → Transaction pooler** into `SUPABASE_DB_URL`, replacing the password and percent-encoding special characters. The server uses a small pool, unnamed queries, transaction-local settings, and certificate-verified TLS. If necessary, copy Supabase's CA certificate into `SUPABASE_DB_CA_CERT` as PEM, with literal `\n` line separators. Never disable certificate checks. [Supabase connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres).
4. Review and run `supabase/migrations/202610020001_portal.sql` once in the project's SQL Editor. This creates the private `pbi_portal` schema and `portal-documents` bucket. It contains no client fixtures. Runtime does not create hosted tables. Do not rerun the initial migration against an existing portal schema or import SQLite using this file.
5. **Do not add `pbi_portal` to exposed Data API schemas.** Browser roles have no schema/table grants; RLS denies browser access even if it is accidentally exposed. Every app request goes through authenticated server membership checks. The server Postgres connection is privileged and must remain private; RLS does not replace those checks. Storage is private and explicitly blocked for browser roles. Documents download through authorized, no-store Next routes, with SHA-256 integrity checks.
6. In Auth settings, disable **Allow new users to sign up**, anonymous sign-ins, and manual identity linking. Keep email confirmation enabled. This restricts OAuth as well as email account creation to existing/invited identities. [Supabase access configuration](https://supabase.com/docs/guides/auth/general-configuration).
7. Set Auth Site URL to `https://client.piercebusinessintegrations.com`. Allow the exact callback URL `https://client.piercebusinessintegrations.com/auth/callback` and its permitted query variations; allow `http://localhost:3000/auth/callback` only while testing against this project (match the actual preview port). Do not add broad deployment wildcards. Session cookies are host-only, HttpOnly, SameSite=Lax, and secure on hosted deployments. Proxy refreshes verified sessions; authorization uses the current server-confirmed user.
8. Configure a verified custom SMTP sender, such as Resend SMTP, for client sign-in codes. The public contact form's Resend API integration does not automatically configure Supabase Auth mail. The default Supabase sender is restricted and unsuitable for client delivery. Keep Auth's rate limits enabled; consider CAPTCHA before external rollout. [SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp).
9. Change the **Magic Link** email template to present `{{ .Token }}` as the sign-in code. The portal requests email OTP with `shouldCreateUser:false` and verifies the entered code. This avoids email-link scanning and opening a link in a different browser. [Passwordless email guidance](https://supabase.com/docs/guides/auth/auth-email-passwordless).
10. Create the initial owner identity deliberately in Supabase Auth, confirm the correct email, and copy its UUID into `PORTAL_ADMIN_USER_ID`. Run `npm run portal:admin`. The script validates that the user exists and is email-confirmed before assigning the owner role. It sends no email. Do not put role flags in editable user metadata.
11. Restart Next after setting environment variables. Hosted authentication cannot use the local SQLite store or development identity chooser. Sign in as owner and create an example project for sandbox verification.

The site can connect to this one project from localhost for setup, but access assignment and provider requests are real external actions. Use only controlled test identities and examples. Once real clients are onboarded, local experimentation should use the isolated preview or an optional local Supabase instance, rather than mutate production client records. [Database backups](https://supabase.com/docs/guides/platform/backups) do **not** back up Storage object bytes: arrange a separate private-file backup/restore process before real-client use.

## Client invitations and profile

Owner project tools accept a client email. **Grant access** connects an existing Supabase identity to that organization. **Create invitation link** creates a Supabase invitation identity and its membership, returning a one-time URL for the owner to share deliberately; it sends no email. It cannot reassign an owner identity as a client. Do not share links with anyone other than the intended person.

`/auth/confirm` displays an acceptance button. Only its explicit POST consumes the invitation token; opening the URL or an email scanner's GET does not. The token is exchanged by Supabase, not trusted as membership. After accepting, the client can enter a name/password in profile settings or use email codes. Membership is checked again on every project, file, invoice, and signing action. An authenticated identity without membership cannot enter the portal.

Google is supported through Supabase OAuth. Configure the Google provider with your OAuth client and the exact **Supabase callback URI** shown in its dashboard. The browser returns through PBI's `/auth/callback`, using PKCE and server cookies. Test that an invited email matches its existing identity and that an unknown Google account is rejected. Google may reject embedded WebViews; verify using a regular browser. [Supabase Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google).

## SignWell sandbox

1. Create a SignWell API account/key and set `SIGNWELL_API_KEY`.
2. Register an HTTPS webhook at `https://client.piercebusinessintegrations.com/api/portal/webhooks/signwell` after the endpoint is deployed, or use a deliberately configured public tunnel for localhost. Set the returned webhook **ID** as `SIGNWELL_WEBHOOK_ID`; this is the HMAC key, not the API key. [Webhook verification](https://developers.signwell.com/reference/event-hash-verification).
3. Set the verified `PBI_SIGNER_EMAIL` and `PBI_SIGNER_NAME` if an agreement needs PBI countersigning. Invited clients need a verified Supabase email matching their assigned signer; membership alone does not permit signing as another recipient.
4. Generate a **v3** agreement, review it, and approve that revision. Existing v2 PDFs stay unchanged and cannot be sent using guessed SignWell coordinates. v3 stores generated field positions inside the fixed PDF, in SignWell's pixel scale, with names/titles/signatures/locked signing dates and ordered recipients. Review the fields in an actual provider test.
5. **Prepare signing** reserves the agreement before requesting SignWell. With `PORTAL_PROVIDER_MODE=test` (the default), the adapter sets `test_mode:true` and accepts only example projects. It uses embedded signing, disables reminders and recipient notifications, and forbids recipient reassignment. Live mode is a separate deliberate configuration described below; it has not been enabled in this build. [Create Document](https://developers.signwell.com/reference/createdocument).
6. **Open agreement signing** loads SignWell's official embed inside a modal; redirects are disabled. Browser completion only refreshes the UI. The server verifies event hashes/timestamps, stores events durably/idempotently, then reconciles the actual document through the provider API before updating anything. The hash covers event type/time, so webhook object fields alone are never authoritative.
7. After all required signers complete, retrieve the completed PDF with its audit page, store it privately, and expose it through existing authorized downloads. Delayed PDF preparation stays pending. Completed versions and original PDFs remain immutable; delayed events cannot regress a completed agreement.
8. Failed work remains in the persisted event queue. Owner **Retry provider updates**, `npm run portal:sync`, or `npm run portal:signing-sync` can retry. The protected scheduled endpoint is implemented below; no recurring hosted job has been deployed.
9. A timed-out create request becomes `submission_unknown` and must never be blindly resubmitted. A verified callback can recover the reserved request by confirmed provider metadata. If no callback arrives, inspect SignWell and reconcile the exact stored sign/document IDs manually before replacing it. Owner cancellation retains portal originals but deletes/cancels the provider's active test document. Completed requests cannot be cancelled through this action.

## Stage invoices and Stripe test payments

Stages are an ordered owner-managed plan with one current stage and optimistic version checking. Completion does not require or imply payment. Stage invoices are explicit reviewed documents with immutable amounts, due dates, and stage snapshots. Clients cannot see drafts; stages with invoice history cannot be deleted. One nonvoided invoice per stage is enforced by the database.

Set `STRIPE_SECRET_KEY` to an `sk_test_` key and register `/api/portal/webhooks/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `charge.refunded`. Set the endpoint's `STRIPE_WEBHOOK_SECRET`. Hosted Checkout collects card details; optional ACH requires account support and `STRIPE_ENABLE_ACH=true`. Payment remains on Stripe-hosted Checkout in this version. [Stripe payment events](https://docs.stripe.com/payments/checkout/fulfillment).

The server validates membership, approved invoice revision, currency/amount, document/session/intent identifiers, and verified webhook signatures. Events are stored before acknowledgement, then processed with transactional status/audit updates. Early events stay queued until checkout is mapped; duplicates and delayed initiation/failure/refund events cannot regress paid or refunded invoices. A return URL never marks payment complete; ACH processing remains separate.

Checkout reserves the exact server-generated request and a unique idempotency key before calling Stripe. Uncertain failures keep the reservation. Recovery replays the identical request/key after two minutes and within 23 hours, then maps the session without marking it paid. Reservations older than 23 hours, legacy reservations without stored parameters, or conflicting data require manual Stripe reconciliation before clearing anything. Stripe can prune keys after 24 hours, so an old uncertain request must never be blindly replayed. [Stripe idempotency](https://docs.stripe.com/api/idempotent_requests).

Keep ACH disabled until its full workflow is accepted. A failed completed ACH session currently requires PBI to arrange the next payment manually; the portal deliberately does not issue another payment opportunity from that completed session. Card retry within an open Checkout session is handled by Stripe. Automatic recurring billing is not implemented; monthly service agreements can use manually issued invoices.

## Provider recovery schedule

Generate a private `CRON_SECRET` with at least 32 random bytes, store it in server environment settings, and schedule a trusted worker every few minutes to call:

```text
GET https://client.piercebusinessintegrations.com/api/portal/maintenance
Authorization: Bearer <CRON_SECRET>
```

The endpoint verifies its bearer secret using constant-time digest comparison. No cookies or public session can authorize scheduled GET requests. Owner POST requests require owner membership and origin checks. Responses contain counts, not credentials, signing links, client document contents, or card data. Bounded batches recover one checkout, process up to 25 Stripe events, and retry up to three SignWell events. Duplicate concurrent runs are safe; durable records survive timeouts. Monitor failed HTTP responses, remaining queue counts, and blocked checkout reservations. The platform must support the route's execution duration. No schedule or hosting plan was changed by this build.

## Preparing real GoToHearing work

1. Complete hosted owner verification and sandbox acceptance first. Keep `PORTAL_PROVIDER_MODE=test` while testing only controlled identities and example records.
2. Set `PORTAL_ALLOW_CLIENT_PROJECTS=true` to permit real client records using hosted PostgreSQL and authenticated Supabase identities. Local preview actors cannot create real clients. New real-client drafts contain no example scope, prices, dates, or legal terms. The original example is never converted into a real project.
3. Enter GoToHearing's agreed legal/organization name, contact and authorized signers, proposed scope, deliverables, exclusions, commercial details, dates, and reviewed terms. None are assumed from the sample. The editor validates missing fields and fixed-price totals before saving.
4. Generate and preview the exact proposal/agreement revision. A real agreement requires the owner's explicit terms-review checkbox before approval. The approval audit stores revision, PDF checksum, and terms checksum. Later edits to project details do not change that approved PDF or its source snapshot.
5. Only after acceptance, reviewed terms, rollout approval, and real-account readiness, deliberately set `PORTAL_PROVIDER_MODE=live`, use a matching `sk_live_` Stripe key and live webhook secret, and confirm SignWell's production/API entitlement. Live mode rejects example projects and local identities; test mode rejects real-client signing/payments. SignWell requests store their mode so historical completions are checked against the original request mode.
6. Generate and deliberately share the intended person's client invitation. Review the invoice version before making it payable. Do not invite clients, prepare live signing, or charge payments merely to check configuration. Provider mode is global to this deployment; use examples for sandbox acceptance before moving to live.

The CLI/dashboard probes check API configuration and expected client-domain webhooks, not an entire transaction. A localhost tunnel or Stripe CLI forwarder can deliver test callbacks, but the connection probe still expects the final client-domain webhook registration. A configured callback without a deployed, reachable endpoint is not sufficient. Complete an actual controlled sandbox signing, download its PDF/audit, and settle a Stripe test payment with verified callbacks before onboarding GoToHearing.

## Domain and rollout

The primary client host is `client.piercebusinessintegrations.com` on the same Next/Vercel deployment as the marketing site. The subdomain root opens `/portal`; private routes and auth callbacks on the marketing/old hosts permanently redirect to the corresponding client path with query strings. Add the client domain to your actual Vercel project and use the exact DNS record it provides, then verify HTTPS. Domain/DNS changes were not performed in this build.

Marketing analytics, Google Ads script loading, and attribution capture now mount in the marketing shell. Private entry routes, invitations, and portal pages do not initially load them. Keep the separate client origin for external use. Workspace/auth routes send noindex/no-store/no-referrer headers; the existing marketing sitemap excludes them.

Before real-client rollout: verify two real invited identities and Google/email sign-in, blocked public registration, host redirects/cookies, private Storage and PDF field alignment, completed SignWell sandbox signing/audit export, Stripe test/webhooks/refunds, queue retries, database/file restore, and approved legal clauses. Review retiring old provider credentials only after migration is verified. No existing remote client database has been imported or overwritten. No deploy, invite delivery, real agreement, or live charge was performed here.
