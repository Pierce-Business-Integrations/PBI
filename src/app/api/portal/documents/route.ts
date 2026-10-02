import { NextRequest, NextResponse } from "next/server";
import { portalActor, requireAdmin } from "@/lib/portal/auth";
import { createDocument } from "@/lib/portal/repository";
import { audit, now, portalDb } from "@/lib/portal/db";
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
    };
    if (!["proposal", "agreement", "invoice"].includes(body.kind))
      throw new Error("Invalid document kind");
    const result = await createDocument(
      actor,
      body.projectId,
      body.kind,
      body.kind === "invoice"
        ? { amountCents: body.amountCents!, due: body.due || "" }
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
    const { documentId } = (await request.json()) as { documentId: string };
    const db = await portalDb();
    const document = (
      await db.execute({
        sql: "SELECT * FROM documents WHERE id=?",
        args: [documentId],
      })
    ).rows[0];
    if (!document || document.status !== "draft")
      throw new Error("Only draft documents can be approved");
    await db.execute({
      sql: "UPDATE documents SET status='approved' WHERE id=? AND status='draft'",
      args: [documentId],
    });
    await audit(
      String(document.organization_id),
      String(document.project_id),
      actor.userId,
      "document.approved",
      { documentId, at: now() },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return portalError(error);
  }
}
