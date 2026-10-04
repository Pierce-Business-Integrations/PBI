import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal/auth";
import { portalSetupReport } from "@/lib/portal/readiness";
import { portalError, sameOrigin } from "@/lib/portal/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    await requireAdmin();
    return NextResponse.json(await portalSetupReport(true), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return portalError(error);
  }
}
