"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ReceiptText } from "lucide-react";
import {
  currentStageIndex,
  isActiveStage,
  stageLabel,
  type ProjectStage,
} from "@/lib/portal/stages";
import {
  invoiceCanCheckout,
  invoiceStatusLabel,
} from "@/lib/portal/payment-status";
import { formatMoney, formatPortalDate } from "@/lib/portal/presentation";

export type StageInvoice = {
  id: string;
  stageId: string | null;
  amountCents: number;
  status: string;
  documentStatus: string;
  due: string | null;
};

export default function ProjectTracker({
  stages,
  invoices,
}: {
  stages: ProjectStage[];
  invoices: StageInvoice[];
}) {
  const current = currentStageIndex(stages);
  const [selectedId, setSelectedId] = useState(stages[current]?.id);
  const selected = Math.max(
    0,
    stages.findIndex((stage) => stage.id === selectedId),
  );
  const stage = stages[selected];
  const rail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = rail.current;
    const button = container?.querySelector<HTMLButtonElement>(
      '[aria-pressed="true"]',
    );
    if (!container || !button || container.scrollWidth <= container.clientWidth)
      return;
    const left =
      container.scrollLeft +
      button.getBoundingClientRect().left -
      container.getBoundingClientRect().left -
      (container.clientWidth - button.offsetWidth) / 2;
    container.scrollTo({ left });
  }, [selectedId]);
  if (!stage) return null;
  const completed = stages.filter((item) => item.status === "complete").length;
  const invoice = invoices.find(
    (item) => item.stageId === stage.id && item.status !== "voided",
  );
  const payable =
    invoice &&
    invoice.documentStatus === "approved" &&
    invoiceCanCheckout(invoice.status);

  return (
    <section
      id="journey"
      aria-labelledby="journey-title"
      className="scroll-mt-24 overflow-hidden rounded-xl border border-[#233a30]/15 bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#233a30]/10 px-5 py-4 sm:px-6">
        <div>
          <h2 id="journey-title" className="text-sm font-semibold">
            Project progress
          </h2>
          <p className="mt-1 text-xs text-[#233a30]/75">
            {completed === stages.length
              ? "All stages complete"
              : `Current stage: ${stages[current].title}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-[#233a30]/75">
            {completed} of {stages.length} complete
          </span>
          <span className="rounded-md border border-[#233a30]/10 bg-[#f5f6f4] px-2.5 py-1 text-xs font-medium tabular-nums">
            {completed === stages.length
              ? "Complete"
              : `Stage ${current + 1} of ${stages.length}`}
          </span>
        </div>
      </div>

      <div
        ref={rail}
        className="overflow-x-auto px-5 pt-5 sm:px-6"
        aria-label="Project stages"
      >
        <ol className="flex min-w-max gap-4">
          {stages.map((item, index) => {
            const active = isActiveStage(item.status);
            const done = item.status === "complete";
            const chosen = item.id === stage.id;
            const itemInvoice = invoices.find(
              (record) =>
                record.stageId === item.id && record.status !== "voided",
            );
            return (
              <li
                key={item.id}
                className="relative min-w-[140px] flex-1 sm:min-w-[160px]"
              >
                {index < stages.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-9 right-[-12px] top-4 h-px ${done ? "bg-[#567d50]/40" : "bg-[#233a30]/15"}`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  aria-current={active ? "step" : undefined}
                  aria-pressed={chosen}
                  aria-controls="stage-details"
                  className={`relative flex min-h-[132px] w-full flex-col items-start border-b-2 pb-4 pr-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#567d50] focus-visible:ring-offset-2 ${chosen ? "border-[#233a30]" : "border-transparent hover:border-[#233a30]/25"}`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${done ? "border-[#567d50]/25 bg-[#edf3eb] text-[#45613f]" : active ? "border-[#233a30] bg-[#233a30] text-white" : "border-[#233a30]/20 bg-white text-[#233a30]/75"}`}
                  >
                    {done ? (
                      <Check size={15} aria-hidden="true" />
                    ) : (
                      String(index + 1).padStart(2, "0")
                    )}
                  </span>
                  <span className="mt-3 max-w-[160px] text-[13px] font-semibold leading-5">
                    {item.title}
                  </span>
                  <span
                    className={`mt-1 text-[11px] ${active ? "font-semibold text-[#45613f]" : "text-[#233a30]/75"}`}
                  >
                    {stageLabel(item.status)}
                  </span>
                  {itemInvoice && (
                    <span className="mt-1 text-[10px] text-[#233a30]/75">
                      {itemInvoice.documentStatus === "draft"
                        ? "Invoice in review"
                        : itemInvoice.status === "paid"
                          ? "Invoice paid"
                          : invoiceCanCheckout(itemInvoice.status)
                            ? `${formatMoney(itemInvoice.amountCents)} due`
                            : invoiceStatusLabel(itemInvoice.status)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div
        id="stage-details"
        aria-labelledby="stage-details-title"
        className="grid scroll-mt-24 border-t border-[#233a30]/10 lg:grid-cols-[1.6fr_1fr]"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[#233a30]/75">
              Stage {selected + 1}
            </span>
            <span
              className={`rounded-md px-2 py-1 text-[11px] font-medium ${isActiveStage(stage.status) ? "bg-[#edf3eb] text-[#45613f]" : "bg-[#f5f6f4] text-[#233a30]/75"}`}
            >
              {stageLabel(stage.status)}
            </span>
          </div>
          <h3
            id="stage-details-title"
            className="mt-3 text-xl font-semibold tracking-tight"
          >
            {stage.title}
          </h3>
          <p className="mt-2 max-w-xl text-[13px] leading-6 text-[#233a30]/80">
            {stage.description}
          </p>
          {stage.deliverables.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-[#233a30]">
                Deliverables
              </p>
              <ul className="mt-2 space-y-1.5">
                {stage.deliverables.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="flex items-start gap-2.5 text-[13px] leading-6 text-[#233a30]/80"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[#779c69]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center border-t border-[#233a30]/10 bg-[#fafbf9] p-5 sm:p-6 lg:border-l lg:border-t-0">
          <p className="flex items-center gap-2 text-xs font-medium text-[#233a30]/75">
            <ReceiptText size={15} aria-hidden="true" /> Stage invoice
          </p>
          {invoice ? (
            <>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[32px] font-semibold leading-tight tracking-tight tabular-nums">
                  {formatMoney(invoice.amountCents)}
                </p>
                <span className="rounded-md border border-[#233a30]/10 bg-white px-2 py-1 text-[11px] font-medium">
                  {invoiceStatusLabel(invoice.status, invoice.documentStatus)}
                </span>
              </div>
              {invoice.due && (
                <p className="mt-2 text-xs text-[#233a30]/75">
                  Due {formatPortalDate(invoice.due)}
                </p>
              )}
              <Link
                href={`/portal/invoices/${invoice.id}`}
                className="mt-5 inline-flex min-h-11 items-center justify-between gap-6 rounded-lg bg-[#233a30] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#3c5548]"
              >
                {payable
                  ? "View & pay invoice"
                  : invoice.documentStatus === "draft"
                    ? "Review invoice"
                    : "View invoice"}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm font-medium">No invoice issued</p>
              <p className="mt-2 max-w-sm text-xs leading-5 text-[#233a30]/75">
                Invoice details and payment options will appear here when PBI
                issues this stage’s invoice.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
