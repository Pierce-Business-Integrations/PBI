import { NextRequest, NextResponse } from "next/server";
import { portalActor } from "@/lib/portal/auth";
import { getPrivateFile } from "@/lib/portal/repository";
import { portalError } from "@/lib/portal/http";
import { audit } from "@/lib/portal/db";

export const runtime = "nodejs";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await portalActor();
    if (!actor) throw new Error("Authentication required");
    const file = await getPrivateFile(actor, (await params).id);
    if (!file) throw new Error("File not found");
    const preview =
      request.nextUrl.searchParams.get("view") === "1" &&
      file.mime_type === "application/pdf";
    await audit(
      String(file.organization_id),
      String(file.project_id),
      actor.userId,
      preview ? "file.viewed" : "file.downloaded",
      { fileId: String(file.id) },
    );
    return new NextResponse(new Uint8Array(file.content as Uint8Array), {
      headers: {
        "Content-Type": String(file.mime_type),
        "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${String(file.filename).replace(/[^a-zA-Z0-9_.-]/g, "_")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return portalError(error);
  }
}
