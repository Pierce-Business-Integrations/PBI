"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { formatMoney } from "@/lib/portal/presentation";

export default function InvoicePayment({
  invoiceId,
  documentId,
  amountCents,
  canPay,
  needsApproval,
  canVoid,
}: {
  invoiceId: string;
  documentId: string;
  amountCents: number;
  canPay: boolean;
  needsApproval: boolean;
  canVoid: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmVoid, setConfirmVoid] = useState(false);
  async function removeInvoice() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/portal/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to void invoice");
      setConfirmVoid(false);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to void invoice",
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(approve = false) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        approve ? "/api/portal/documents" : "/api/portal/pay",
        {
          method: approve ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(approve ? { documentId } : { invoiceId }),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "Unable to continue. Please try again.",
        );
      if (!approve) {
        if (!result.url)
          throw new Error("Checkout is unavailable. Please contact PBI.");
        window.location.assign(result.url);
      } else {
        router.refresh();
        setBusy(false);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to continue. Please try again.",
      );
      setBusy(false);
    }
  }
  return (
    <div>
      {needsApproval ? (
        <button
          onClick={() => submit(true)}
          disabled={busy}
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-[#233a30] px-6 py-3 text-sm font-semibold text-white hover:bg-[#567d50] disabled:opacity-60"
        >
          {busy ? "Approving…" : "Approve invoice"}
          <ArrowUpRight size={17} aria-hidden="true" />
        </button>
      ) : canPay ? (
        <>
          <button
            onClick={() => submit()}
            disabled={busy}
            className="flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-[#233a30] px-6 py-3 text-sm font-semibold text-white hover:bg-[#567d50] disabled:opacity-60"
          >
            {busy ? "Opening checkout…" : `Pay ${formatMoney(amountCents)}`}
            <ArrowUpRight size={17} aria-hidden="true" />
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#233a30]/60">
            <LockKeyhole size={13} aria-hidden="true" /> Secure checkout with
            Stripe
          </p>
        </>
      ) : null}
      {error && (
        <p role="alert" className="mt-4 text-sm leading-6 text-[#773f36]">
          {error}
        </p>
      )}
      {canVoid && (
        <div className="mt-5 text-center text-xs">
          {confirmVoid ? (
            <>
              <p className="mb-3 leading-5">
                Void this invoice? It will remain in the project history and can
                no longer be paid.
              </p>
              <button
                disabled={busy}
                onClick={removeInvoice}
                className="rounded-full border border-[#773f36]/40 px-4 py-2 font-semibold text-[#773f36]"
              >
                Confirm void
              </button>
              <button
                disabled={busy}
                onClick={() => setConfirmVoid(false)}
                className="ml-3 px-2 py-2 underline"
              >
                Keep invoice
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmVoid(true)}
              className="min-h-10 underline underline-offset-4"
            >
              Void invoice
            </button>
          )}
        </div>
      )}
    </div>
  );
}
