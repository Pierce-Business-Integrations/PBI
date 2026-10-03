import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActor } from "@/lib/portal/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { sameOrigin, portalError } from "@/lib/portal/http";
export async function PATCH(request: NextRequest) {
  try {
    sameOrigin(request);
    const actor = await requireActor();
    if (actor.simulated) throw new Error("Profile management is unavailable");
    const body = await request.json();
    const attributes =
      body.action === "name"
        ? {
            data: {
              full_name: z.string().trim().min(1).max(100).parse(body.name),
            },
          }
        : body.action === "password"
          ? { password: z.string().min(12).max(128).parse(body.password) }
          : null;
    if (!attributes) throw new Error("Invalid profile action");
    const { error } = await (
      await supabaseServer()
    ).auth.updateUser(attributes);
    if (error)
      throw new Error(
        "Unable to update your profile. Sign in again and retry.",
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return portalError(error);
  }
}
