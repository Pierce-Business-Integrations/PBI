import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal/auth";
import {
  reconcilePortalProviders,
  validMaintenanceToken,
} from "@/lib/portal/maintenance";
import { portalError, sameOrigin } from "@/lib/portal/http";
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  if (!validMaintenanceToken(request.headers.get("authorization")))
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401, headers },
    );
  try {
    return NextResponse.json(await reconcilePortalProviders(), { headers });
  } catch {
    return NextResponse.json(
      { error: "Provider recovery failed. Retry required." },
      { status: 503, headers },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    await requireAdmin();
    return NextResponse.json(await reconcilePortalProviders(), { headers });
  } catch (error) {
    return portalError(error);
  }
}
