import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  PencilLine,
  ReceiptText,
} from "lucide-react";
import { isAdmin, portalActor } from "@/lib/portal/auth";
import { getProjectBundle } from "@/lib/portal/repository";
import { projectFocus } from "@/lib/portal/project-focus";
import ProjectEditor from "../project-editor";
import ProjectWorkflow from "../project-workflow";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { id } = await params;
  const actor = await portalActor();
  if (!actor)
    redirect(`/sign-in?redirect_url=${encodeURIComponent(`/portal/${id}`)}`);
  const bundle = await getProjectBundle(id, actor);
  if (!bundle) notFound();
  const admin = await isAdmin(actor.userId);
  const { payment } = await searchParams;
  const documentCount = bundle.documents.length;
  const invoiceCount = bundle.invoices.length;
  const focus = projectFocus({
    documents: bundle.documents.map((document) => ({
      id: String(document.id),
      kind: String(document.kind),
      status: String(document.status),
    })),
    invoices: bundle.invoices.map((invoice) => ({
      documentId: String(invoice.document_id),
      status: String(invoice.status),
      simulationStatus: invoice.simulation_status
        ? String(invoice.simulation_status)
        : null,
    })),
    signing: bundle.signing.map((request) => ({
      documentId: String(request.document_id),
      status: String(request.status),
    })),
    admin,
    simulated: actor.simulated,
  });

  return (
    <div className="space-y-9">
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <Link
          href="/portal"
          className="inline-flex min-h-11 items-center gap-2 font-semibold text-[#55725c] hover:text-[#233a30]"
        >
          <ArrowLeft size={16} aria-hidden="true" /> All projects
        </Link>
      </div>

      <header className="border-b border-[#233a30]/15 pb-9 sm:pb-11">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#55725c]">
            {bundle.project.demo
              ? "Demo project · illustrative only"
              : "Client project"}
          </p>
          <h1 className="mt-5 font-serif text-[clamp(2.75rem,5vw,4.75rem)] leading-[1.04] tracking-[-0.045em]">
            {String(bundle.project.name)}
          </h1>
          <p className="mt-4 text-sm font-semibold text-[#55725c]">
            {String(bundle.project.organization_name)}
          </p>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-[#233a30]/70 sm:text-base sm:leading-7">
            {bundle.details.summary}
          </p>
        </div>
      </header>

      {payment && (
        <p
          className="rounded-2xl border border-[#d8a45b] bg-white px-6 py-5 text-sm leading-6"
          role="status"
        >
          You returned from checkout. We’ll update the invoice after Stripe
          confirms the payment. Refresh this page to see its latest status.
        </p>
      )}
      {actor.simulated && (
        <aside
          className="border-l-[3px] border-[#d8a45b] bg-[#f1e9dc] px-6 py-5 text-sm leading-6"
          aria-label="Local demo notice"
        >
          <strong>Local demo.</strong> Identity, signing, and payment actions
          are simulated. No signature or charge occurs.
        </aside>
      )}

      <section
        aria-labelledby="focus-title"
        className="grid gap-4 lg:grid-cols-[1.6fr_0.8fr]"
      >
        <div className="rounded-2xl border border-[#d8a45b]/60 bg-white p-7 shadow-sm sm:p-8">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#567d50]">
            <span
              className="h-2 w-2 rounded-full bg-[#779c69]"
              aria-hidden="true"
            />
            {focus.eyebrow}
          </p>
          <h2
            id="focus-title"
            className="mt-4 font-serif text-3xl leading-tight sm:text-4xl"
          >
            {focus.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#233a30]/75">
            {focus.description}
          </p>
          <a
            href={focus.href}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#233a30] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#567d50]"
          >
            {focus.action} <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-[#779c69]/30 bg-[#e9eee6] p-7 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#567d50]">
            At a glance
          </p>
          <div className="mt-6 space-y-5">
            <div className="flex items-center gap-4 border-b border-[#233a30]/15 pb-5">
              <FileText size={22} strokeWidth={1.5} aria-hidden="true" />
              <p className="text-sm">
                <strong className="font-serif text-2xl font-normal">
                  {documentCount}
                </strong>
                <span className="ml-2 text-[#233a30]/70">
                  {documentCount === 1
                    ? "document version"
                    : "document versions"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ReceiptText size={22} strokeWidth={1.5} aria-hidden="true" />
              <p className="text-sm">
                <strong className="font-serif text-2xl font-normal">
                  {invoiceCount}
                </strong>
                <span className="ml-2 text-[#233a30]/70">
                  {invoiceCount === 1 ? "invoice" : "invoices"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="overview"
        aria-labelledby="overview-title"
        className="scroll-mt-28 rounded-2xl border border-[#d8a45b]/50 bg-white p-7 sm:p-9"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#779c69]">
          Project brief
        </p>
        <h2 id="overview-title" className="mt-2 font-serif text-3xl">
          What we’re working toward
        </h2>
        <div className="mt-7 grid gap-7 border-t border-[#d8a45b]/40 pt-7 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              The problem
            </h3>
            <p className="mt-2 text-sm leading-7 text-[#233a30]/80">
              {bundle.details.problem}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Desired outcome
            </h3>
            <p className="mt-2 text-sm leading-7 text-[#233a30]/80">
              {bundle.details.desiredOutcome}
            </p>
          </div>
        </div>
      </section>

      <section
        id="documents"
        aria-labelledby="documents-title"
        className="scroll-mt-28"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#779c69]">
          Project records
        </p>
        <h2
          id="documents-title"
          className="mt-2 font-serif text-3xl sm:text-4xl"
        >
          Documents & payments
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#233a30]/70">
          Review each version and its current status. Agreements and invoices
          show their next available action alongside the document.
        </p>
        <ProjectWorkflow
          projectId={id}
          organizationId={String(bundle.project.organization_id)}
          documents={bundle.documents.map((d) => ({
            id: String(d.id),
            kind: String(d.kind),
            revision: Number(d.revision),
            status: String(d.status),
            fileId: String(d.file_id),
          }))}
          invoices={bundle.invoices.map((i) => ({
            id: String(i.id),
            documentId: String(i.document_id),
            amountCents: Number(i.amount_cents),
            status: String(i.status),
            simulationStatus: i.simulation_status
              ? String(i.simulation_status)
              : null,
          }))}
          signing={bundle.signing.map((s) => ({
            id: String(s.id),
            documentId: String(s.document_id),
            provider: String(s.provider),
            status: String(s.status),
            completedFileId: s.completed_file_id
              ? String(s.completed_file_id)
              : null,
          }))}
          admin={admin}
          simulated={actor.simulated}
        />
      </section>

      {admin && (
        <details
          id="edit-project"
          className="group rounded-2xl border border-[#d8a45b]/50 bg-white p-6 sm:p-8"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 marker:hidden">
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#779c69]">
                Owner tools
              </span>
              <span className="mt-2 block font-serif text-2xl">
                Edit project draft
              </span>
              <span className="mt-1 block text-sm leading-6 text-[#233a30]/70">
                Update the source details, then generate a new document
                revision. Existing versions remain unchanged.
              </span>
            </span>
            <PencilLine size={22} aria-hidden="true" className="shrink-0" />
          </summary>
          <div className="mt-7 border-t border-[#d8a45b]/40 pt-2">
            <ProjectEditor initial={bundle.details} projectId={id} />
          </div>
        </details>
      )}
    </div>
  );
}
