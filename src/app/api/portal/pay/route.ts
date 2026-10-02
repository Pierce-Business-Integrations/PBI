import { NextRequest, NextResponse } from "next/server";
import { portalActor } from "@/lib/portal/auth";
import { checkoutInvoice } from "@/lib/portal/payments";
import { sameOrigin, portalError } from "@/lib/portal/http";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const actor = await portalActor();
    if (!actor) throw new Error("Authentication required");
    const { invoiceId } = await request.json();
    return NextResponse.json({
      url: await checkoutInvoice(actor, invoiceId, request.nextUrl.origin),
    });
  } catch (error) {
    return portalError(error);
  }
}
