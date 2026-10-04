import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/portal/auth";
import { linkStageInvoice, saveStagePlan } from "@/lib/portal/repository";
import { sameOrigin, portalError } from "@/lib/portal/http";
import { formatValidationError } from "@/lib/portal/schema";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: Context) {
  try {
    sameOrigin(request);
    const actor = await requireAdmin();
    return NextResponse.json(
      await saveStagePlan(
        actor,
        (await context.params).id,
        await request.json(),
      ),
    );
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: formatValidationError(error) },
        { status: 400 },
      );
    return portalError(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    sameOrigin(request);
    const actor = await requireAdmin();
    const { stageId, invoiceId } = z
      .object({ stageId: z.uuid(), invoiceId: z.uuid() })
      .parse(await request.json());
    await linkStageInvoice(
      actor,
      (await context.params).id,
      stageId,
      invoiceId,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return portalError(error);
  }
}
