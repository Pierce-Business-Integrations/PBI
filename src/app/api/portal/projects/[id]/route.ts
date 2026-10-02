import { NextRequest, NextResponse } from "next/server";
import { portalActor } from "@/lib/portal/auth";
import { getProjectBundle, updateProject } from "@/lib/portal/repository";
import { sameOrigin, portalError } from "@/lib/portal/http";
import { formatValidationError } from "@/lib/portal/schema";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, context: Context) {
  try {
    const actor = await portalActor();
    if (!actor) throw new Error("Authentication required");
    const bundle = await getProjectBundle((await context.params).id, actor);
    if (!bundle) throw new Error("Project not found");
    return NextResponse.json(bundle);
  } catch (error) {
    return portalError(error);
  }
}
export async function PUT(request: NextRequest, context: Context) {
  try {
    sameOrigin(request);
    const actor = await portalActor();
    if (!actor) throw new Error("Authentication required");
    await updateProject(actor, (await context.params).id, await request.json());
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: formatValidationError(error) },
      { status: 400 },
    );
  }
}
