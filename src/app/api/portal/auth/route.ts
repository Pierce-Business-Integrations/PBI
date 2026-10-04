import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { sameOrigin, portalError } from "@/lib/portal/http";
import { authDestination } from "@/lib/portal/auth-navigation";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const body = await request.json();
    const supabase = await supabaseServer();
    const next = authDestination(body.next);
    const appOrigin =
      process.env.NODE_ENV === "development"
        ? request.nextUrl.origin
        : "https://client.piercebusinessintegrations.com";
    if (body.action === "google") {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${appOrigin}/auth/callback?next=${encodeURIComponent(next)}`,
          skipBrowserRedirect: true,
        },
      });
      if (error || !data.url)
        throw new Error(
          "Google sign-in is unavailable. Try your email instead.",
        );
      return NextResponse.json({ url: data.url });
    }
    const email = z.email().max(254).parse(body.email);
    if (body.action === "email") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error?.status === 429)
        throw new Error("Please wait a moment before requesting another code.");
      return NextResponse.json({
        ok: true,
        message:
          "If this email has client access, a sign-in code is on its way.",
      });
    }
    if (body.action === "verify") {
      const token = z
        .string()
        .regex(/^\d{6,10}$/)
        .parse(body.code);
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (error)
        throw new Error(
          "That code is invalid or has expired. Request a new code.",
        );
    } else if (body.action === "password") {
      const password = z.string().min(1).max(256).parse(body.password);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error("We couldn't sign you in with those details.");
    } else throw new Error("Invalid sign-in action");
    return NextResponse.json({ url: next });
  } catch (error) {
    return portalError(error);
  }
}
