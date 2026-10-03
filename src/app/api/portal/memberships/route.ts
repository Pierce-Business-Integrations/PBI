import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal/auth";
import { connectClient } from "@/lib/portal/invitations";
import { portalError, sameOrigin } from "@/lib/portal/http";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const actor = await requireAdmin();
    const { organizationId, email, invite } = await request.json();
    if (typeof organizationId !== "string" || typeof email !== "string")
      throw new Error("Organization and client email are required");
    return NextResponse.json(
      await connectClient(actor, organizationId, email, invite === true),
    );
  } catch (error) {
    return portalError(error);
  }
}
