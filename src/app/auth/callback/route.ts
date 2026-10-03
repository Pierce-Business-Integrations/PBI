import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { authDestination } from "@/lib/portal/auth-navigation";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const { error } = await (
      await supabaseServer()
    ).auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(
          authDestination(request.nextUrl.searchParams.get("next")),
          request.url,
        ),
      );
  }
  return NextResponse.redirect(new URL("/sign-in?error=callback", request.url));
}
