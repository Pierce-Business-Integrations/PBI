export function invoiceCanCheckout(status: string) {
  return status === "open" || status === "failed";
}
