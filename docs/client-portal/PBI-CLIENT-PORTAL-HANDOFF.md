# PBI client portal: implementation handoff

Prepared October 1, 2026, America/New_York. This brief captures the owner's goals and the proposed architecture from a ChatGPT conversation. It is not an existing-code audit. Verify repository facts before making implementation choices.

## Outcome

Build a focused client portal within the existing Pierce Business Integrations (PBI) website. Clients should log in to see their projects, proposals, agreements, invoices, and completed signed documents. The owner wants a polished, seamless experience and better document creation than HoneyBook currently provides. The objective is a useful first version in a weekend, not feature parity with HoneyBook.

Jacob is comfortable with Next.js, TypeScript, Tailwind, backend development, and Azure. Reuse the actual repository's framework, conventions, authentication, database, storage, and hosting wherever practical; these capabilities have not yet been verified in this conversation.

## Brand and visual reference

- Brand: Pierce Business Integrations (PBI).
- Legal entity: Pierce Business Group LLC (no comma). PBI is its DBA.
- Tagline: Modern solutions. Local partnership.
- Website: https://piercebusinessintegrations.com
- Supplied brand colors: cream #f9f3ed, gold #d8a45b, green #779c69, black.
- Deep forest #233a30 is an additional supporting color used in the liked sample, not a separately confirmed official brand color.
- Supplied logos are in reference/logos/. Use actual assets; do not regenerate the logo.
- The owner explicitly liked reference/PBI-GoToHearing-Sample-Proposal.pdf. Treat it as the document visual reference: warm cream pages, dark forest panels, restrained gold rules, serif headings, clear sans-serif body text, generous spacing, simple scope rows, an investment card, and restrained footers.
- Keep the portal consistent with the existing site while applying the sample's document design. Do not redesign the public marketing site as part of this task.
- The sample's $1,500/month, 10-hour allowance, scope, and other commercial terms are illustrative. They are NOT approved GoToHearing terms and must not become production defaults. Demo records must be unmistakably labeled as examples.

## Core design decision

Separate AI drafting from deterministic document rendering.

1. AI helps turn a conversation, meeting notes, or emails into structured project details.
2. PBI validates and stores those details, then renders a consistently branded preview and PDF using versioned templates.
3. The owner reviews the commercial details and approves the exact document version.
4. An established signing provider collects required information and signatures.
5. PBI stores the completed signed PDF and completion/audit record and displays their status in the portal.

AI must not reinvent the document layout each time or silently invent prices, dates, commitments, or standard legal clauses. Do not render arbitrary AI-supplied HTML as trusted content. An external PDF upload is an additional path for existing or exceptional documents, not the main source of project data.

## First version workflow

Build one complete workflow using a clearly labeled GoToHearing demo client:

- Owner creates a client and project and records the client's authorized signer(s).
- Owner enters or imports structured scope, deliverables, exclusions, pricing, payment schedule, dates, and proposed terms. Provide a normal editor as well as validated JSON import from an external AI chat; publish the schema and an example import file.
- System identifies required information that is missing rather than filling it with assumptions.
- Owner previews and generates a polished proposal PDF using the saved PBI template.
- Owner prepares an agreement with reusable terms and signer fields, reviews it, and approves a version for signing.
- Client accesses their own project, views documents, completes designated fields, and signs through the signing provider.
- Completed documents are saved and available to authorized client and admin users.
- Owner creates a matching branded invoice; client pays through Stripe-hosted payment UI.
- Verified provider events update signing and payment status.

An internal AI chat can follow later. Do not make an AI API integration or model subscription a prerequisite for the initial document workflow.

## Documents and signing

Support a reusable proposal template and agreement composition that can cover a one-time project or recurring service engagement. Share design components rather than building unrelated layouts.

Store editable draft data, generated files, template versions, recipients, field definitions, and document revision history. Once a document is sent for signing, keep its content immutable. A material change creates a new revision and explicitly supersedes/voids the previous signing request as appropriate. Never rewrite the signed original.

Separate owner-finalized information (scope, fees, payment schedule, exclusions) from signer-completed fields (signature, name, title, and requested company details). Clearly identify whether client-provided information is a preliminary intake field or part of the signed document. Support client and PBI signatures when required and defined signing order.

Keep standard agreement clauses in a reviewed, versioned clause set. Flag modifications to standard terms for review. Placeholder legal text must be labeled as unreviewed and must not be represented as production-approved.

No signing provider has been selected. Inspect existing integrations first. Otherwise evaluate a small number of established providers against embedded signing, required fields, completed PDF/audit export, sandbox availability, and actual API-plan cost. Docusign was discussed as an example, not a mandate. Document the selection and any owner setup needed. Do not build an original electronic-signature infrastructure for this MVP.

## Invoices and payments

Stripe is the intended payment provider. Build PBI's own invoice records and branded PDFs, with Stripe processing payments. Avoid automatically adding the paid Stripe Invoicing product unless its features justify its incremental cost.

Prefer provider-hosted payment collection; do not collect raw card or bank credentials in PBI. Include card and ACH support when available for the configured account. Keep ACH processing, paid, and failed states distinct: bank payment initiation is not payment completion. A payment return page alone must not mark an invoice paid.

Map payment requests to immutable invoice versions and authoritative amounts. Verify webhook authenticity, process duplicate events idempotently, and handle failures and relevant refunds. Recurring service agreements can initially use manually issued monthly invoices; automatic subscription billing is not required for the first version. No claim is made that Stripe will necessarily reduce every payment fee; compare real account pricing when configuring it.

## Access and storage requirements

Enforce authorization on the server for every client, project, document, invoice, download, and mutation. Clients can access only their assigned organizations/projects; changing an ID or URL must not bypass this. Admin privileges must come from trusted server-side role data. Reuse established authentication rather than writing password infrastructure.

Keep private files private and authorize downloads. Maintain relevant audit events and provider IDs. Keep secrets server-side and out of repository history, client bundles, and logs. Use sandbox/test credentials during development. Do not import real client data into demo fixtures or put confidential files in public assets.

## Scope boundaries

Do not add a full CRM, lead pipeline, calendar, email synchronization, time tracking, accounting suite, marketing automation, or complex subscription engine in the weekend version. Keep integration boundaries small enough to change providers later without overbuilding a generic platform.

Do not migrate or cancel HoneyBook, send real client invitations or agreements, charge real payments, or deploy production changes merely because this brief describes the future workflow. Those actions require explicit task authorization. Local implementation, migrations prepared for review, tests, private previews, and sandbox integrations are in scope when requested by the kickoff prompt.

## Implementation approach

Read AGENTS.md and inspect the codebase first. Identify existing systems and gaps, propose a short implementation sequence, then start building; do not stop at a plan or a UI-only mockup. Make sensible routine decisions and document them. Ask focused questions only for missing information that materially blocks work. If provider credentials or external setup are missing, continue independent work with clearly labeled development adapters and record what remains unverified.

Start with the real project data model and branded document renderer, then complete authentication/authorization, portal access, signing, and invoicing/payments in dependency order. Keep the layout responsive and client-facing wording free of implementation details. Track progress, decisions, and blockers in docs/client-portal/IMPLEMENTATION-STATUS.md so work survives future sessions.

## Acceptance checks

- Valid structured data renders into the saved PBI design; missing required fields and invalid commercial data produce useful validation errors.
- Test both a short proposal and a long multi-page scope. Inspect PDF output for wrapping, page breaks, headers, footers, signature-field placement, and clipping.
- Test admin access and at least two separate client identities. Client A cannot read or modify client B's records or files, including through direct requests and download URLs.
- A document sent for signing cannot change in place; revisions do not overwrite the signed PDF.
- Complete a sandbox signing flow and retrieve the completed document; handle duplicate provider events and unsuccessful/voided requests without reporting success.
- Complete a Stripe test payment, verify authentic webhook handling, reject invalid events, handle duplicates, and keep a processing ACH invoice unpaid until the appropriate confirmed event.
- Run the repository's applicable lint, typecheck, build, and meaningful tests. State which external integrations were actually exercised and which remain simulated or blocked.
- Deliver a private working preview, setup instructions, environment-variable names without secrets, migration instructions, and a concise remaining-work list. A weekend target is an estimate, not evidence of production readiness.
