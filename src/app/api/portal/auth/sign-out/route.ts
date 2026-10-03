import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { configuredSupabase, supabaseServer } from "@/lib/supabase/server";
import { cookieName } from "@/lib/portal/auth";
import { sameOrigin, portalError } from "@/lib/portal/http";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    if (configuredSupabase) {
      const { error } = await (await supabaseServer()).auth.signOut();
      if (error) throw new Error("Unable to sign out. Please try again.");
    }
    (await cookies()).delete(cookieName);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return portalError(error);
  }
}
