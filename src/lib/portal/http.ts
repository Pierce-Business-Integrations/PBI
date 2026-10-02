import { NextRequest, NextResponse } from "next/server";

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin)
    throw new Error("Invalid request origin");
}

export function portalError(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed";
  const status = /Authentication required/.test(message)
    ? 401
    : /access|Admin|not found/i.test(message)
      ? 403
      : 400;
  return NextResponse.json({ error: message }, { status });
}
