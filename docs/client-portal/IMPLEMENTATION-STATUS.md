# PBI client portal implementation status

## Scope and environment

Work is on `beta`. The public site is a Next.js 16 App Router application. It had no authentication, database, private storage, signing, or Stripe integration when this work began. The supplied sample is a visual reference only; all sample commercial details remain demo data.

## Sequence

1. Define validated project data, persist private records, and render versioned PBI proposal/agreement/invoice PDFs.
2. Add server-checked admin/client access, editing, revisions, and authorized downloads.
3. Connect sandbox signing and Stripe Checkout/webhooks, with explicitly labeled local development simulations when credentials are absent.
4. Verify access isolation, document layout, provider event transitions, lint, typecheck, and build; document beta setup.

## Decisions

- Keep the existing marketing site and its Next.js architecture.
- Use libSQL: an ignored local SQLite file for local development and a remote libSQL URL/token for beta hosting. Generated PDFs are private database blobs served only after authorization. This favors a small first version over a separate storage service.
- Use Clerk for hosted identity when configured. Local development identity switching is limited to `NODE_ENV=development` and is explicitly simulated; beta requires real Clerk keys and server-side portal membership records.
- Use deterministic PDF templates built from validated structured data. No AI API is required. The agreement clause set is unreviewed demo text until approved by counsel.
- Use Dropbox Sign API test mode for provider signing when credentials are configured. Never issue a production signature request in this build.
- Use Stripe test-mode hosted Checkout. A return page is informational; only verified webhooks change payment status.

## Progress

- [x] Inspected repository, handoff, reference PDF, and PBI logos.
- [x] Confirmed `beta` branch and moved handoff/reference into `docs/client-portal`.
- [x] Added root `AGENTS.md` pointer.
- [x] Structured records, automatic schema initialization/migration, versioned document renderer, schema/example import, normal editor, private PDF blobs, audit events.
- [x] Server-enforced owner/client portal, Clerk integration points, owner membership bootstrap, client access assignment, per-request authorization, private downloads, noindex headers.
- [x] Dropbox Sign test-mode embedded signing adapter, verified event handler, completed PDF retrieval, request void path, and separate local signing simulation.
- [x] Stripe test-mode hosted Checkout adapter, immutable invoice amount/session matching, verified webhook handling, ACH processing distinction, refunds, and separate local payment simulation.
- [x] Setup guide, short and long PDF generation tests, local role-isolation smoke checks, lint, typecheck, tests, and build.
- [x] Visible account entry in public navigation/footer; branded sign-in, sign-up, account hub, and profile route. Direct portal visits pass through sign-in. Google is delegated to Clerk's configured social connection; new accounts receive no project membership automatically.
- [x] Refreshed portal dashboard and project pages with clearer project context, document/version states, client actions, responsive layouts, and owner tools that stay out of the client view. Invoice creation now checks amount/date before submission.
- [x] Checkout eligibility is shared by the UI and server: only open or failed invoices may start checkout. Processing and settled invoices do not present or accept another checkout.
- [x] Account and portal routes now have a focused workspace shell, separate from the public site's decorative frame and marketing navigation. The dashboard opens the most recent project directly; project guidance points to the relevant document based on actual signing/payment state.
- [x] Authorized PDFs now open in a dedicated in-workspace reader, with a new-tab fallback and a separate download action. The same server access check and no-store response apply to preview and download, and each action is audited separately. Portal actions refresh route data without a full-page reload. Branded loading, unavailable-project, and retryable error states cover transitions and failures.
- [x] Document, signing, and payment badges now use client-readable wording; simulated signing records explicitly say that no signature exists.
- [x] Reworked the client workspace into a distinct product shell with a desktop navigation rail and responsive mobile navigation. The project overview now has a clearer hierarchy and list-style project navigation; project detail headers use the same visual system. The local demo notice is compact with identity switching available on demand. No project access or provider behavior changed.
- [x] Public navigation now says **Clients** and leads to a public explanation page. The private account/profile/portal stay behind authenticated portal membership, and public self-registration links have been removed. The sign-up route is reserved for invitation tickets; Clerk must be configured in Invite-only mode before beta use.
- [x] Added production host routing for `client.piercebusinessintegrations.com` within the existing Next.js project. The subdomain root opens `/portal`; existing private-page URLs on the main, www, and former PWS hosts permanently redirect to the matching client-host path with query strings. Marketing links from the workspace return to the primary domain. Localhost and the beta hostname remain testable on their current paths. Clerk authorized parties default to the production client and beta preview origins, with an environment override.
- [x] Vercel Analytics and its click tracker now mount only on marketing routes, so private workspace paths are excluded from those page views. The pre-existing Google Ads tag remains in the root layout and should be reviewed before beta deployment for any private-route tracking.

## Blockers and verification limits

- No provider credentials were supplied. Live sandbox signing and Stripe payments cannot be exercised until they are configured. Local simulations must remain visibly labeled and cannot be used in beta/production.
- The Dropbox Sign API plan and signing domain must be confirmed before any production use. Agreement legal terms must be reviewed before real agreements.
- The deployment's libSQL database and Clerk identities/memberships require owner setup. No production deployment is authorized.
- The beta domain has not been deployed from this checkout. A local preview was started at `http://localhost:3002/portal` for review.
- Clerk keys and its Google connection are still absent from the local environment. The branded account routes and local demo fallback can be reviewed, but a real Google/email sign-up and sign-in cannot be claimed as tested until the Clerk instance is configured.
- Clerk Invite-only mode, real invitation redemption, and the membership handoff have not been exercised with provider credentials. The public page and local membership gate are implemented; beta configuration is still required.
- The client subdomain is not attached to the Vercel project or configured in DNS from this checkout. Production Clerk/Google domain settings and provider webhook URLs must be updated and tested before client invitations are sent. No production deployment was made.
- The complete Dropbox Sign callback, audit-trail PDF, field placement in its embedded UI, and a real Stripe test payment/webhook have not been exercised against provider accounts. Local simulations are tracked separately and never mark real payment or legal signing complete.
- All project creation and updates are restricted to labeled demo data in this build. Remove this guard only after legal and production readiness review.

## Verification completed

- `npm run lint`, `npm run typecheck`, `npm test` (30 tests), and `npm run build` passed on Next.js 16.3.8. Next.js was updated from 16.2.10 after a dependency audit showed critical advisories in that version.
- Generated and visually inspected short proposal (3 pages), long proposal (8 pages), agreement (5 pages), and invoice (2 pages). Corrected a rule overlap and aligned the planned signing fields to the dedicated signature pages. Provider field placement still needs sandbox confirmation.
- At `localhost:3002`, owner login returned both demo projects; Client A and B each received exactly one. Client A's direct request for B's project and PDF returned 403. B's own draft PDF returned 403 and the approved PDF returned 200.
- An approved demo agreement started a local signing simulation and Client A completed it; no signed file was fabricated. A demo invoice moved through simulated processing and confirmation while its real status remained `open`.
- `/portal` and a project page rendered 200 locally with `X-Robots-Tag: noindex, nofollow`.
- New account flow verification: `/account`, `/sign-in`, and `/sign-up` returned 200 with `X-Robots-Tag: noindex, nofollow`; unauthenticated `/portal` and `/account/profile` redirected to sign-in with their return paths. A local demo client reached `/account`, `/account/profile`, and `/portal`, while `/sign-in` redirected that signed-in identity to `/account`.
- Visually reviewed the refreshed owner dashboard and project/document views at desktop and 390px mobile widths in a local browser. The client-facing document list and owner controls remain separate.
- Visually checked the dedicated workspace shell on portal, project, and account pages at desktop and 390px mobile widths, and confirmed the marketing homepage kept its original visual frame. A client-authorized PDF returned `inline` for preview and `attachment` for download; a second client's preview request returned 403.
- Rechecked Client A's focused project guidance against its actual demo invoice: the UI now says the simulation completed while the real invoice remains open, with no charge. The unavailable-project route showed the branded recovery state without exposing a project; streamed Next.js responses may use HTTP 200 for this state.
- Visually reviewed the in-workspace invoice reader and embedded PDF at desktop and 390px mobile widths. Client A opened its reader; Client B saw the unavailable-project state for A's reader URL and received 403 for the underlying PDF request.
- Visually reviewed the revised workspace overview and project detail at 1440px desktop and 390px mobile widths. The desktop rail, project list, and responsive header rendered as intended. Lint, typecheck, 30 tests, and production build passed after the visual work.
- Verified the public Clients page at desktop and 390px mobile sizes. Direct `/sign-up` visits return to `/clients`; unauthenticated `/account` and `/portal` stream redirects without protected data; the project API returns 401. A local demo owner still reaches the client home and portal. Lint, typecheck, 30 tests, and build passed for the access change.
- Tested production-host rules against the local Next.js server using explicit Host headers: the client host root returned `/portal`, primary/www/old-domain private links returned 308 redirects to matching client-host paths with query strings, client-host marketing paths returned to the primary domain, and the beta host still served `/portal`. The production build includes these host rules. DNS lookup for `client.piercebusinessintegrations.com` currently returns no record.
- A repository-wide `npm run format:check` still reports pre-existing formatting differences in 42 marketing-site/support files and the lockfile. The new portal source and docs were formatted; unrelated marketing files were left untouched.
- The post-update production dependency audit reported one moderate advisory. Full audit reported four advisories including development dependencies; resolve or re-evaluate before production rollout.
