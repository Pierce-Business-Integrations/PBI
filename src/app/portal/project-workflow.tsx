"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDownToLine,
  Eye,
  FileCheck2,
  FileText,
  Plus,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { invoiceCanCheckout } from "@/lib/portal/payment-status";
import { openSignWell } from "@/lib/portal/signwell-embed";

type Doc = {
  id: string;
  kind: string;
  revision: number;
  status: string;
  fileId: string;
};
type Invoice = {
  id: string;
  documentId: string;
  amountCents: number;
  status: string;
};
type Signing = {
  id: string;
  documentId: string;
  provider: string;
  status: string;
  completedFileId: string | null;
};

const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#233a30]/20 bg-white px-3 py-2 text-xs font-medium text-[#233a30] transition hover:border-[#233a30]/40 hover:bg-[#f5f6f4] disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#233a30] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3c5548] disabled:cursor-not-allowed disabled:opacity-50";
const inputClass =
  "mt-2 w-full rounded-lg border border-[#233a30]/25 bg-white px-3 py-2 text-sm focus:border-[#567d50] focus:outline-none focus:ring-2 focus:ring-[#779c69]/30";

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function documentStatus(status: string) {
  const messages: Record<string, string> = {
    draft: "In PBI review",
    approved: "Ready to review",
    signing: "Signing underway",
    completed: "Completed",
    superseded: "Previous version",
    voided: "Voided",
  };
  return messages[status] || label(status);
}

function signingStatus(status: string) {
  const messages: Record<string, string> = {
    pending: "Awaiting signatures",
    preparing: "Preparing agreement",
    submission_unknown: "PBI is checking the agreement",
    awaiting_file: "Final PDF processing",
    completed: "Signed PDF available",
    declined: "Signing declined",
    voided: "Request voided",
    simulated_pending: "Not available yet",
    simulated_complete: "No signature on file",
  };
  return `Signing: ${messages[status] || label(status)}`;
}

function paymentStatus(status: string) {
  const messages: Record<string, string> = {
    open: "Invoice open",
    processing: "Payment processing",
    paid: "Paid",
    failed: "Payment failed",
    partially_refunded: "Partially refunded",
    refunded: "Refunded",
    voided: "Voided",
  };
  return messages[status] || label(status);
}

function statusClass(status: string) {
  if (["paid", "completed", "approved"].includes(status))
    return "border-[#779c69]/40 bg-[#779c69]/15 text-[#233a30]";
  if (["failed", "voided", "refunded", "superseded"].includes(status))
    return "border-[#a1594c]/30 bg-[#a1594c]/10 text-[#773f36]";
  return "border-[#d8a45b]/55 bg-[#d8a45b]/15 text-[#55452e]";
}

function Status({ text, status }: { text: string; status: string }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-medium ${statusClass(status)}`}
    >
      {text}
    </span>
  );
}

export default function ProjectWorkflow({
  projectId,
  organizationId,
  documents,
  invoices,
  signing,
  admin,
  clientProject = false,
  stages,
}: {
  projectId: string;
  organizationId: string;
  documents: Doc[];
  invoices: Invoice[];
  signing: Signing[];
  admin: boolean;
  clientProject?: boolean;
  stages: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewedAgreements, setReviewedAgreements] = useState<
    Record<string, boolean>
  >({});
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDue, setInvoiceDue] = useState("");
  const [invoiceStage, setInvoiceStage] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [invitationUrl, setInvitationUrl] = useState("");
  const archived = documents.filter((document) =>
    ["voided", "superseded"].includes(document.status),
  );
  const currentDocuments = documents.filter(
    (document) => !["voided", "superseded"].includes(document.status),
  );

  async function action(
    path: string,
    method: string,
    body: unknown,
    navigate = false,
  ) {
    setBusy(true);
    setMessage("");
    try {
      const result = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || "Request failed");
      if (data.invitationUrl) setInvitationUrl(data.invitationUrl);
      if (navigate && data.url) {
        window.location.assign(data.url);
        return;
      }
      router.refresh();
      setBusy(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
      setBusy(false);
    }
  }

  async function sign(request: Signing) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/portal/sign?signId=${encodeURIComponent(request.id)}`,
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await openSignWell(
        result.url,
        () => {
          setMessage(
            "Your signing step is finished. The completed agreement will appear after all signers finish.",
          );
          router.refresh();
        },
        () =>
          setMessage("Signing is temporarily unavailable. Please try again."),
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to open signing",
      );
    } finally {
      setBusy(false);
    }
  }

  function createInvoice() {
    const amountCents = Math.round(Number(invoiceAmount) * 100);
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || !invoiceDue) {
      setMessage("Enter a positive invoice amount and a due date.");
      return;
    }
    action("/api/portal/documents", "POST", {
      projectId,
      kind: "invoice",
      amountCents,
      due: invoiceDue,
      stageId: invoiceStage || undefined,
    });
  }

  return (
    <div className="mt-4 space-y-3" aria-busy={busy}>
      {message && (
        <p
          role="alert"
          className="rounded-xl border border-[#a1594c]/50 bg-white px-5 py-4 text-sm text-[#773f36]"
        >
          {message}
        </p>
      )}

      {documents.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#779c69]/60 bg-white px-7 py-10">
          <FileText
            size={30}
            strokeWidth={1.5}
            aria-hidden="true"
            className="text-[#779c69]"
          />
          <h3 className="mt-4 font-serif text-2xl">No documents yet</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#233a30]/75">
            {admin
              ? "Use the owner tools below to generate a proposal, agreement, or invoice from the saved project details."
              : "Documents will appear here after PBI prepares and shares them with your account."}
          </p>
        </div>
      )}

      {currentDocuments.map((doc) => {
        const request = signing.find((item) => item.documentId === doc.id);
        const invoice = invoices.find((item) => item.documentId === doc.id);
        const Icon =
          doc.kind === "invoice"
            ? ReceiptText
            : doc.kind === "agreement"
              ? FileCheck2
              : FileText;
        return (
          <article
            key={doc.id}
            id={`document-${doc.id}`}
            className="scroll-mt-24 rounded-xl border border-[#233a30]/15 bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex min-w-0 items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#233a30]/10 bg-[#f5f6f4] text-[#55725c]">
                  <Icon size={19} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{label(doc.kind)}</h3>
                  <p className="mt-1 text-xs text-[#233a30]/75">
                    Version {doc.revision}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/portal/documents/${doc.fileId}`}
                  aria-label={`View ${label(doc.kind)} version ${doc.revision} PDF`}
                  className={primaryButtonClass}
                >
                  <Eye size={16} aria-hidden="true" /> View PDF
                </Link>
                <a
                  href={`/api/portal/files/${doc.fileId}`}
                  className={buttonClass}
                >
                  <ArrowDownToLine size={16} aria-hidden="true" /> Download
                </a>
              </div>
            </div>

            <div
              className="mt-4 flex flex-wrap gap-2 border-t border-[#233a30]/10 pt-3"
              aria-label="Document status"
            >
              <Status
                text={
                  doc.status === "signing" &&
                  request?.status.startsWith("simulated_")
                    ? "Agreement available"
                    : documentStatus(doc.status)
                }
                status={doc.status}
              />
              {request && (
                <Status
                  text={signingStatus(request.status)}
                  status={request.status}
                />
              )}
              {invoice && (
                <Status
                  text={paymentStatus(invoice.status)}
                  status={invoice.status}
                />
              )}
            </div>

            {invoice && (
              <p className="mt-5 text-sm text-[#233a30]/75">
                Invoice amount{" "}
                <strong className="ml-2 font-serif text-xl font-normal text-[#233a30]">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(invoice.amountCents / 100)}
                </strong>
              </p>
            )}

            {admin &&
              clientProject &&
              doc.kind === "agreement" &&
              doc.status === "draft" && (
                <label className="mt-5 flex items-start gap-3 text-sm leading-6">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0"
                    checked={Boolean(reviewedAgreements[doc.id])}
                    onChange={(e) =>
                      setReviewedAgreements((current) => ({
                        ...current,
                        [doc.id]: e.target.checked,
                      }))
                    }
                  />
                  I have reviewed this version&apos;s scope, fees,
                  responsibilities, and agreement terms for this client.
                </label>
              )}
            <div className="mt-5 flex flex-wrap gap-3">
              {invoice &&
                doc.status === "approved" &&
                invoiceCanCheckout(invoice.status) && (
                  <Link
                    href={`/portal/invoices/${invoice.id}`}
                    className={primaryButtonClass}
                  >
                    View & pay invoice
                  </Link>
                )}
              {admin && doc.status === "draft" && (
                <button
                  disabled={
                    busy ||
                    (clientProject &&
                      doc.kind === "agreement" &&
                      !reviewedAgreements[doc.id])
                  }
                  onClick={() =>
                    action("/api/portal/documents", "PATCH", {
                      documentId: doc.id,
                      termsReviewed: Boolean(reviewedAgreements[doc.id]),
                    })
                  }
                  className={primaryButtonClass}
                >
                  Approve this version
                </button>
              )}
              {admin &&
                doc.kind === "agreement" &&
                doc.status === "approved" &&
                !request && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      action("/api/portal/sign", "POST", { documentId: doc.id })
                    }
                    className={primaryButtonClass}
                  >
                    Prepare signing
                  </button>
                )}
              {request &&
                ["signwell-test", "signwell-live"].includes(request.provider) &&
                request.status === "pending" && (
                  <button
                    disabled={busy}
                    onClick={() => sign(request)}
                    className={primaryButtonClass}
                  >
                    Open agreement signing
                  </button>
                )}
              {admin &&
                request &&
                ["pending", "simulated_pending"].includes(request.status) && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      action("/api/portal/sign", "DELETE", {
                        signId: request.id,
                      })
                    }
                    className={buttonClass}
                  >
                    Void request
                  </button>
                )}
              {request?.completedFileId && (
                <Link
                  href={`/portal/documents/${request.completedFileId}`}
                  aria-label="View completed PDF and audit trail"
                  className={primaryButtonClass}
                >
                  <Eye size={16} aria-hidden="true" /> View completed PDF &
                  audit trail
                </Link>
              )}
            </div>
          </article>
        );
      })}

      {archived.length > 0 && (
        <details className="rounded-2xl border border-[#233a30]/15 bg-white p-6">
          <summary className="cursor-pointer text-sm font-semibold">
            Earlier versions & archived invoices ({archived.length})
          </summary>
          <ul className="mt-4 divide-y divide-[#233a30]/10">
            {archived.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <span>
                  {label(doc.kind)} · Version {doc.revision}{" "}
                  <span className="ml-2 text-xs text-[#233a30]/60">
                    {documentStatus(doc.status)}
                  </span>
                </span>
                <Link
                  href={`/portal/documents/${doc.fileId}`}
                  className="inline-flex min-h-10 items-center gap-2 font-semibold underline underline-offset-4"
                >
                  View PDF <Eye size={14} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}

      {admin && (
        <details className="group rounded-xl border border-[#233a30]/15 bg-white p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 marker:hidden">
            <span>
              <span className="block text-[11px] font-medium text-[#55725c]">
                Owner tools
              </span>
              <span className="mt-1 block text-sm font-semibold">
                Prepare documents & access
              </span>
              <span className="mt-1 block text-xs leading-5 text-[#233a30]/75">
                Generate a version, create an invoice, or connect a verified
                client account.
              </span>
            </span>
            <Plus
              size={22}
              aria-hidden="true"
              className="shrink-0 transition group-open:rotate-45"
            />
          </summary>
          <div className="mt-7 grid gap-7 border-t border-[#d8a45b]/40 pt-7 lg:grid-cols-2">
            <div>
              <h3 className="font-semibold">Generate a document</h3>
              <p className="mt-1 text-sm leading-6 text-[#233a30]/70">
                Each generation creates a new, fixed PDF version from the saved
                draft.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["proposal", "agreement"] as const).map((kind) => (
                  <button
                    key={kind}
                    disabled={busy}
                    onClick={() =>
                      action("/api/portal/documents", "POST", {
                        projectId,
                        kind,
                      })
                    }
                    className={buttonClass}
                  >
                    New {kind}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Create an invoice</h3>
              <label className="mt-3 block text-sm font-medium">
                Project stage
                <select
                  value={invoiceStage}
                  onChange={(event) => setInvoiceStage(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Project-wide invoice</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Amount (USD)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={invoiceAmount}
                    onChange={(event) => setInvoiceAmount(event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-medium">
                  Due date
                  <input
                    type="date"
                    value={invoiceDue}
                    onChange={(event) => setInvoiceDue(event.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
              <button
                disabled={busy}
                onClick={createInvoice}
                className={`${buttonClass} mt-4`}
              >
                Create invoice
              </button>
            </div>
            <div className="border-t border-[#d8a45b]/40 pt-6 lg:col-span-2">
              <h3 className="flex items-center gap-2 font-semibold">
                <ShieldCheck size={18} aria-hidden="true" /> Grant client access
              </h3>
              <p className="mt-1 text-sm leading-6 text-[#233a30]/70">
                Connect an existing client by email, or create an invitation
                link to share with them.
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="min-w-48 flex-1 text-sm font-medium">
                  Client email
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(event) => {
                      setClientEmail(event.target.value);
                      setInvitationUrl("");
                    }}
                    placeholder="client@company.com"
                    className={inputClass}
                  />
                </label>
                <button
                  disabled={busy || !clientEmail.trim()}
                  onClick={() =>
                    action("/api/portal/memberships", "POST", {
                      organizationId,
                      email: clientEmail.trim(),
                    })
                  }
                  className={buttonClass}
                >
                  Grant access
                </button>
                <button
                  disabled={busy || !clientEmail.trim()}
                  onClick={() =>
                    action("/api/portal/memberships", "POST", {
                      organizationId,
                      email: clientEmail.trim(),
                      invite: true,
                    })
                  }
                  className={buttonClass}
                >
                  Create invitation link
                </button>
              </div>
              {invitationUrl && (
                <div className="mt-4">
                  <label className="block text-sm font-medium">
                    Invitation link
                    <input
                      readOnly
                      value={invitationUrl}
                      className={inputClass}
                      onFocus={(event) => event.target.select()}
                    />
                  </label>
                  <p className="mt-2 text-xs text-[#233a30]/70">
                    Share this one-time link with the client. It has not been
                    emailed.
                  </p>
                </div>
              )}
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
