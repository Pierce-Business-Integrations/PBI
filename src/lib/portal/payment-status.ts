export function invoiceCanCheckout(status: string) {
  return status === "open" || status === "failed";
}

// Delayed initiation/failure callbacks must never undo settlement or a refund.
export function nextInvoiceStatus(current: string, requested: string) {
  if (current === "voided")
    throw new Error("Voided invoices cannot accept payments");
  if (current === "refunded") return current;
  if (current === "partially_refunded")
    return requested === "refunded" ? requested : current;
  if (
    current === "paid" &&
    !["refunded", "partially_refunded"].includes(requested)
  )
    return current;
  if (current === "failed" && requested === "processing") return current;
  return requested;
}

export function invoiceStatusLabel(
  status: string,
  documentStatus = "approved",
) {
  if (documentStatus === "draft") return "In review";
  return (
    (
      {
        open: "Payment due",
        processing: "Payment processing",
        paid: "Paid",
        failed: "Payment failed",
        partially_refunded: "Partially refunded",
        refunded: "Refunded",
        voided: "Voided",
      } as Record<string, string>
    )[status] || status
  );
}
