import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowDownToLine, ArrowLeft, FileText } from "lucide-react";
import { isAdmin, portalActor } from "@/lib/portal/auth";
import { getInvoiceBundle } from "@/lib/portal/repository";
import {
  invoiceCanCheckout,
  invoiceStatusLabel,
} from "@/lib/portal/payment-status";
import {
  formatMoney,
  formatPortalDate,
  projectDisplayName,
  projectDisplaySummary,
} from "@/lib/portal/presentation";
import InvoicePayment from "./invoice-payment";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { id } = await params;
  const actor = await portalActor();
  if (!actor)
    redirect(
      `/sign-in?redirect_url=${encodeURIComponent(`/portal/invoices/${id}`)}`,
    );
  const bundle = await getInvoiceBundle(actor, id);
  if (!bundle) notFound();
  const { invoice, source } = bundle;
  const { payment } = await searchParams;
  const status = String(invoice.status);
  const documentStatus = String(invoice.document_status);
  const admin = await isAdmin(actor.userId);
  const amount = Number(invoice.amount_cents);
  const title = invoice.stage_title
    ? String(invoice.stage_title)
    : "Project invoice";
  const canPay = documentStatus === "approved" && invoiceCanCheckout(status);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/portal/${invoice.project_id}`}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#55725c] hover:text-[#233a30]"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Back to project
      </Link>
      <header className="border-b border-[#233a30]/15 pb-6">
        <p className="text-xs font-medium text-[#55725c]">
          Invoice · Version {Number(invoice.revision)}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[32px]">
          {title}
        </h1>
        <p className="mt-3 text-sm text-[#233a30]/65">
          {projectDisplayName(
            String(invoice.project_name),
            Boolean(invoice.demo),
          )}
        </p>
      </header>
      {payment === "returned" && (
        <p
          role="status"
          className="rounded-xl border border-[#779c69]/30 bg-white p-5 text-sm leading-6"
        >
          {status === "paid"
            ? "Payment received. Thank you."
            : "Your payment is awaiting confirmation. The invoice will update when the payment provider confirms its result."}
        </p>
      )}
      {payment === "cancelled" && (
        <p
          role="status"
          className="rounded-xl border border-[#233a30]/15 bg-white p-5 text-sm"
        >
          Checkout closed. You can return to this invoice whenever you’re ready.
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section
          aria-labelledby="invoice-details"
          className="rounded-xl border border-[#233a30]/15 bg-white p-5 sm:p-6"
        >
          <h2 id="invoice-details" className="text-base font-semibold">
            Invoice details
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#233a30]/75">
            {source.invoice?.stage?.description ||
              projectDisplaySummary(
                String(source.details.summary),
                Boolean(invoice.demo),
              )}
          </p>
          <dl className="mt-7 grid grid-cols-2 gap-5 border-y border-[#233a30]/10 py-6 text-sm">
            <div>
              <dt className="text-xs text-[#233a30]/60">Issued</dt>
              <dd className="mt-1 font-medium">
                {formatPortalDate(String(invoice.created_at))}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#233a30]/60">Due date</dt>
              <dd className="mt-1 font-medium">
                {formatPortalDate(source.invoice?.due)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#233a30]/60">Status</dt>
              <dd className="mt-1 font-medium">
                {invoiceStatusLabel(status, documentStatus)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#233a30]/60">Currency</dt>
              <dd className="mt-1 font-medium">USD</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold">
            <Link
              href={`/portal/documents/${invoice.file_id}`}
              className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4"
            >
              <FileText size={16} aria-hidden="true" /> View invoice PDF
            </Link>
            <a
              href={`/api/portal/files/${invoice.file_id}`}
              className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4"
            >
              <ArrowDownToLine size={16} aria-hidden="true" /> Download
            </a>
          </div>
        </section>
        <aside
          aria-label="Payment summary"
          className="rounded-xl border border-[#233a30]/15 bg-white p-5 sm:p-6"
        >
          <p className="text-xs font-medium text-[#55725c]">
            {status === "paid"
              ? "Payment received"
              : status === "voided" || status === "refunded"
                ? "Invoice total"
                : "Invoice amount"}
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">
            {formatMoney(amount)}
          </p>
          <div className="mt-6 flex items-center justify-between border-t border-[#233a30]/15 pt-5 text-sm">
            <span>{invoiceStatusLabel(status, documentStatus)}</span>
            <span className="font-semibold">{formatMoney(amount)}</span>
          </div>
          <div className="mt-7">
            <InvoicePayment
              invoiceId={id}
              documentId={String(invoice.document_id)}
              amountCents={amount}
              canPay={canPay}
              needsApproval={admin && documentStatus === "draft"}
              canVoid={
                admin &&
                invoiceCanCheckout(status) &&
                !invoice.stripe_session_id &&
                !invoice.checkout_attempt
              }
            />
          </div>
          {status === "processing" && (
            <p className="mt-4 text-sm leading-6 text-[#233a30]/70">
              Your payment is processing. You don’t need to submit another
              payment.
            </p>
          )}
          <p className="mt-6 text-center text-xs text-[#233a30]/65">
            Questions about this invoice?{" "}
            <Link
              href="/contact"
              className="font-semibold underline underline-offset-4"
            >
              Contact PBI
            </Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
