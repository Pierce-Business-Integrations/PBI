import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  configuredSupabase,
  supabasePublicConfig,
} from "@/lib/supabase/config";

export default async function proxy(request: NextRequest) {
  if (
    !configuredSupabase ||
    request.nextUrl.pathname.startsWith("/api/portal/webhooks/") ||
    request.nextUrl.pathname === "/api/portal/maintenance"
  )
    return NextResponse.next();
  const { url, key } = supabasePublicConfig();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers || {}).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });
  await supabase.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/portal/:path*",
    "/api/portal/:path*",
    "/account/:path*",
    "/sign-in/:path*",
    "/sign-up/:path*",
    "/auth/:path*",
  ],
};
