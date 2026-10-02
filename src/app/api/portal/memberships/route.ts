import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal/auth";
import { addMembership } from "@/lib/portal/repository";
import { portalError, sameOrigin } from "@/lib/portal/http";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const actor = await requireAdmin();
    const { organizationId, userId } = await request.json();
    if (
      typeof organizationId !== "string" ||
      typeof userId !== "string" ||
      userId.length < 3
    )
      throw new Error("Organization and Clerk user ID are required");
    await addMembership(actor, organizationId, userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return portalError(error);
  }
}
