import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatValidationError } from "./schema";

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin)
    throw new Error("Invalid request origin");
}

export function portalError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    typeof error.type === "string" &&
    error.type.startsWith("Stripe")
  )
    return NextResponse.json(
      {
        error:
          "Online payments are temporarily unavailable. Please contact PBI.",
      },
      { status: 503 },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: formatValidationError(error) },
      { status: 400 },
    );
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string" &&
    /^(?:[0-9A-Z]{5}|ECONN|ENOTFOUND|ETIMEDOUT)/.test(error.code)
  )
    return NextResponse.json(
      {
        error: "Unable to complete this request. Please refresh and try again.",
      },
      { status: 503 },
    );
  const message = error instanceof Error ? error.message : "Request failed";
  const status = /Authentication required/.test(message)
    ? 401
    : /access|Admin|not found/i.test(message)
      ? 403
      : 400;
  return NextResponse.json({ error: message }, { status });
}
