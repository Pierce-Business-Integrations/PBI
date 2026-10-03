import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal/auth";
import { voidInvoice } from "@/lib/portal/repository";
import { sameOrigin, portalError } from "@/lib/portal/http";

export const runtime = "nodejs";
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(request);
    await voidInvoice(await requireAdmin(), (await context.params).id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return portalError(error);
  }
}
