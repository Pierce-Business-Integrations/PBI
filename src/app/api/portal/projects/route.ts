import { NextRequest, NextResponse } from "next/server";
import { portalActor } from "@/lib/portal/auth";
import { createProject, listProjects } from "@/lib/portal/repository";
import { sameOrigin, portalError } from "@/lib/portal/http";

export const runtime = "nodejs";
export async function GET() {
  try {
    const actor = await portalActor();
    if (!actor)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    return NextResponse.json(await listProjects(actor));
  } catch (error) {
    return portalError(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const actor = await portalActor();
    if (!actor) throw new Error("Authentication required");
    const id = await createProject(actor, await request.json());
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return portalError(error);
  }
}
