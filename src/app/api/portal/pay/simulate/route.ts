import { NextRequest, NextResponse } from "next/server";
import { portalActor, mayAccessOrganization } from "@/lib/portal/auth";
import { audit, now, portalDb } from "@/lib/portal/db";
import { portalError, sameOrigin } from "@/lib/portal/http";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    if (
      process.env.NODE_ENV !== "development" ||
      !["localhost", "127.0.0.1"].includes(request.nextUrl.hostname)
    )
      throw new Error("Simulation unavailable");
    const actor = await portalActor();
    if (!actor?.simulated) throw new Error("Development identity required");
    const { invoiceId, state } = (await request.json()) as {
      invoiceId: string;
      state: "processing" | "paid" | "failed";
    };
    if (!["processing", "paid", "failed"].includes(state))
      throw new Error("Invalid simulation state");
    const db = await portalDb();
    const invoice = (
      await db.execute({
        sql: "SELECT i.*,d.status AS document_status FROM invoices i JOIN documents d ON d.id=i.document_id WHERE i.id=?",
        args: [invoiceId],
      })
    ).rows[0];
    if (
      !invoice ||
      !(await mayAccessOrganization(
        actor.userId,
        String(invoice.organization_id),
      ))
    )
      throw new Error("Invoice not found");
    if (invoice.document_status !== "approved")
      throw new Error("Approve the invoice first");
    if (invoice.status !== "open" || invoice.stripe_session_id)
      throw new Error(
        "Only an unpaid invoice without Stripe activity may be simulated",
      );
    if (
      state === "processing" &&
      ![null, "simulated_failed"].includes(
        invoice.simulation_status as string | null,
      )
    )
      throw new Error("Start with an open invoice");
    if (
      state !== "processing" &&
      invoice.simulation_status !== "simulated_processing"
    )
      throw new Error("Simulated payment must be processing first");
    const status = `simulated_${state}`;
    await db.execute({
      sql: "UPDATE invoices SET simulation_status=?,updated_at=? WHERE id=?",
      args: [status, now(), invoiceId],
    });
    await audit(
      String(invoice.organization_id),
      String(invoice.project_id),
      actor.userId,
      `invoice.${status}`,
      { invoiceId, noPayment: true },
    );
    return NextResponse.json({ status, simulation: true });
  } catch (error) {
    return portalError(error);
  }
}
