export function invoiceCanCheckout(status: string) {
  return status === "open" || status === "failed";
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
