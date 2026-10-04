import { NextRequest, NextResponse } from "next/server";
import { portalActor } from "@/lib/portal/auth";
import {
  signerUrl,
  simulateSigning,
  startSigning,
  voidSigning,
} from "@/lib/portal/signing";
import { sameOrigin, portalError } from "@/lib/portal/http";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const actor = await portalActor();
    if (!actor) throw new Error("Authentication required");
    const { documentId } = await request.json();
    return NextResponse.json(await startSigning(actor, documentId));
  } catch (error) {
    return portalError(error);
  }
}
export async function GET(request: NextRequest) {
  try {
    const actor = await portalActor();
    if (!actor) throw new Error("Authentication required");
    const signId = request.nextUrl.searchParams.get("signId");
    if (!signId) throw new Error("Signing request ID required");
    return NextResponse.json(
      {
        url: await signerUrl(actor, signId),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return portalError(error);
  }
}
export async function PATCH(request: NextRequest) {
  try {
    sameOrigin(request);
    const actor = await portalActor();
    if (!actor) throw new Error("Authentication required");
    const { signId } = await request.json();
    await simulateSigning(actor, signId);
    return NextResponse.json({ status: "simulated_complete" });
  } catch (error) {
    return portalError(error);
  }
}
export async function DELETE(request: NextRequest) {
  try {
    sameOrigin(request);
    const actor = await portalActor();
    if (!actor) throw new Error("Authentication required");
    const { signId } = await request.json();
    return NextResponse.json({ status: await voidSigning(actor, signId) });
  } catch (error) {
    return portalError(error);
  }
}
