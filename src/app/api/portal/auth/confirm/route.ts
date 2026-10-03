import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sameOrigin, portalError } from "@/lib/portal/http";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const { token, type } = await request.json();
    if (
      typeof token !== "string" ||
      token.length < 20 ||
      token.length > 512 ||
      !["invite", "recovery"].includes(type)
    )
      throw new Error(
        "This link is invalid. Please contact PBI for a new invitation.",
      );
    const { error } = await (
      await supabaseServer()
    ).auth.verifyOtp({ token_hash: token, type });
    if (error)
      throw new Error(
        "This link has expired or was already used. Please request a new invitation.",
      );
    return NextResponse.json({ url: "/account/profile" });
  } catch (error) {
    return portalError(error);
  }
}
