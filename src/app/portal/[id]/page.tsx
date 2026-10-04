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
import {
  projectDisplayName,
  projectDisplaySummary,
} from "@/lib/portal/presentation";
import ProjectEditor from "../project-editor";
import ProjectWorkflow from "../project-workflow";
import ProjectTracker from "../project-tracker";
import StageManager from "../stage-manager";

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
  const stageInvoices = bundle.invoices.map((invoice) => ({
    id: String(invoice.id),
    stageId: invoice.stage_id ? String(invoice.stage_id) : null,
    amountCents: Number(invoice.amount_cents),
    status: String(invoice.status),
    documentStatus: String(invoice.document_status),
    due: invoice.due ? String(invoice.due) : null,
  }));
  const currentStage = bundle.stages.find((stage) =>
    ["in_progress", "waiting_on_client"].includes(stage.status),
  );
  const stagesComplete =
    bundle.stages.length > 0 &&
    bundle.stages.every((stage) => stage.status === "complete");
  const focus = projectFocus({
    documents: bundle.documents.map((document) => ({
      id: String(document.id),
      kind: String(document.kind),
      status: String(document.status),
    })),
    invoices: bundle.invoices.map((invoice) => ({
      documentId: String(invoice.document_id),
      status: String(invoice.status),
    })),
    signing: bundle.signing.map((request) => ({
      documentId: String(request.document_id),
      status: String(request.status),
    })),
    admin,
    simulated: actor.simulated,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
        <Link
          href="/portal"
          className="inline-flex min-h-10 items-center gap-2 font-medium text-[#55725c] hover:text-[#233a30]"
        >
          <ArrowLeft size={16} aria-hidden="true" /> All projects
        </Link>
      </div>

      <header>
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-[32px]">
              {projectDisplayName(
                String(bundle.project.name),
                Boolean(bundle.project.demo),
              )}
            </h1>
            {(currentStage || stagesComplete) && (
              <span className="rounded-md border border-[#567d50]/20 bg-[#edf3eb] px-2.5 py-1 text-xs font-medium text-[#45613f]">
                {stagesComplete
                  ? "Complete"
                  : currentStage?.status === "waiting_on_client"
                    ? "Awaiting your input"
                    : "In progress"}
              </span>
            )}
          </div>
          {!bundle.project.demo && (
            <p className="mt-4 text-sm font-semibold text-[#55725c]">
              {String(bundle.project.organization_name)}
            </p>
          )}
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#233a30]/75">
            {projectDisplaySummary(
              bundle.details.summary,
              Boolean(bundle.project.demo),
            )}
          </p>
        </div>
        <nav
          aria-label="Project sections"
          className="mt-5 flex gap-6 border-b border-[#233a30]/15 text-xs font-medium"
        >
          {bundle.stages.length > 0 && (
            <a
              href="#journey"
              className="inline-flex min-h-10 items-center border-b-2 border-[#233a30]"
            >
              Progress
            </a>
          )}
          <a
            href="#overview"
            className="inline-flex min-h-10 items-center text-[#233a30]/75 hover:text-[#233a30]"
          >
            Project brief
          </a>
          <a
            href="#documents"
            className="inline-flex min-h-10 items-center text-[#233a30]/75 hover:text-[#233a30]"
          >
            Documents
          </a>
        </nav>
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
      {bundle.stages.length ? (
        <ProjectTracker
          key={`tracker-${bundle.project.stage_version}`}
          stages={bundle.stages}
          invoices={stageInvoices}
        />
      ) : (
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
      )}

      <section
        id="overview"
        aria-labelledby="overview-title"
        className="scroll-mt-24 rounded-xl border border-[#233a30]/15 bg-white p-5 sm:p-6"
      >
        <h2 id="overview-title" className="text-sm font-semibold">
          Project brief
        </h2>
        <div className="mt-4 grid gap-6 border-t border-[#233a30]/10 pt-5 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold">The problem</h3>
            <p className="mt-2 text-[13px] leading-6 text-[#233a30]/80">
              {bundle.details.problem}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold">Desired outcome</h3>
            <p className="mt-2 text-[13px] leading-6 text-[#233a30]/80">
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
        <h2 id="documents-title" className="text-base font-semibold">
          {bundle.stages.length ? "Project documents" : "Documents & payments"}
        </h2>
        <p className="mt-1 text-xs leading-5 text-[#233a30]/75">
          Proposals, agreements, and saved document versions.
        </p>
        <ProjectWorkflow
          clientProject={!bundle.details.demo}
          projectId={id}
          organizationId={String(bundle.project.organization_id)}
          documents={bundle.documents
            .filter(
              (document) =>
                !bundle.invoices.some(
                  (invoice) =>
                    invoice.document_id === document.id && invoice.stage_id,
                ),
            )
            .map((d) => ({
              id: String(d.id),
              kind: String(d.kind),
              revision: Number(d.revision),
              status: String(d.status),
              fileId: String(d.file_id),
            }))}
          stages={bundle.stages.map((stage) => ({
            id: stage.id,
            title: stage.title,
          }))}
          invoices={bundle.invoices.map((i) => ({
            id: String(i.id),
            documentId: String(i.document_id),
            amountCents: Number(i.amount_cents),
            status: String(i.status),
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
        />
      </section>

      {admin && (
        <StageManager
          key={`stages-${bundle.project.stage_version}`}
          projectId={id}
          version={Number(bundle.project.stage_version)}
          stages={bundle.stages}
          invoices={stageInvoices}
        />
      )}

      {admin && (
        <details
          id="edit-project"
          className="group rounded-xl border border-[#233a30]/15 bg-white p-5"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 marker:hidden">
            <span>
              <span className="block text-[11px] font-medium text-[#55725c]">
                Owner tools
              </span>
              <span className="mt-1 block text-sm font-semibold">
                Edit project draft
              </span>
              <span className="mt-1 block text-xs leading-5 text-[#233a30]/75">
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
