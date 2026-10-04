import { NextRequest, NextResponse } from "next/server";
import { portalActor, requireAdmin } from "@/lib/portal/auth";
import { approveDocument, createDocument } from "@/lib/portal/repository";
import { z } from "zod";
import { sameOrigin, portalError } from "@/lib/portal/http";
import type { DocumentKind } from "@/lib/portal/documents";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const actor = await portalActor();
    if (!actor) throw new Error("Authentication required");
    const body = (await request.json()) as {
      projectId: string;
      kind: DocumentKind;
      amountCents?: number;
      due?: string;
      stageId?: string;
    };
    if (!["proposal", "agreement", "invoice"].includes(body.kind))
      throw new Error("Invalid document kind");
    const result = await createDocument(
      actor,
      body.projectId,
      body.kind,
      body.kind === "invoice"
        ? {
            amountCents: body.amountCents!,
            due: body.due || "",
            stageId: body.stageId,
          }
        : undefined,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return portalError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    sameOrigin(request);
    const actor = await requireAdmin();
    const { documentId, termsReviewed } = z
      .object({
        documentId: z.string().min(1),
        termsReviewed: z.boolean().default(false),
      })
      .parse(await request.json());
    await approveDocument(actor, documentId, termsReviewed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return portalError(error);
  }
}
