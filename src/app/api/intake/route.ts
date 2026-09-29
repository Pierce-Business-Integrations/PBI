import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/lib/site";
import {
  intakeConfirmationEmail,
  intakeInternalEmail,
} from "@/lib/intake-emails";
import { INTAKE_COOKIE_NAME, intakeSessionIsValid } from "@/lib/intake-access";
import { processIntakeSubmission } from "@/lib/intake-service";
import { usesPbiMailDomain } from "@/lib/mail-domain";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 96 * 1024;
const genericError =
  "We couldn’t send the project intake right now. Please try again or contact Pierce Business Integrations directly.";

type TurnstileResponse = { success: boolean; hostname?: string };

function allowedHosts() {
  const hosts = new Set<string>();
  for (const url of [site.url, process.env.NEXT_PUBLIC_SITE_URL]) {
    if (!url) continue;
    try {
      const host = new URL(url).host.toLowerCase();
      hosts.add(host);
      hosts.add(host.startsWith("www.") ? host.slice(4) : `www.${host}`);
    } catch {}
  }
  if (process.env.VERCEL_URL) hosts.add(process.env.VERCEL_URL.toLowerCase());
  if (process.env.NODE_ENV !== "production") {
    hosts.add("localhost:3000");
    hosts.add("127.0.0.1:3000");
  }
  return hosts;
}

function requestOriginIsAllowed(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host")?.toLowerCase();
  if (!origin || !host) return false;
  try {
    const originUrl = new URL(origin);
    if (
      process.env.NODE_ENV !== "production" &&
      originUrl.host.toLowerCase() === host &&
      ["localhost", "127.0.0.1"].includes(originUrl.hostname.toLowerCase())
    )
      return true;
    const allowed = allowedHosts();
    return allowed.has(originUrl.host.toLowerCase()) && allowed.has(host);
  } catch {
    return false;
  }
}

async function verifyTurnstile(token: string, expectedHostname: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new Error("Turnstile is not configured.");
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) return false;
  const result = (await response.json()) as TurnstileResponse;
  return Boolean(
    result.success &&
    (process.env.NODE_ENV !== "production" ||
      !result.hostname ||
      result.hostname.toLowerCase() === expectedHostname.toLowerCase()),
  );
}

const jsonError = (status = 400) =>
  NextResponse.json({ ok: false, message: genericError }, { status });

export async function POST(request: NextRequest) {
  if (!intakeSessionIsValid(request.cookies.get(INTAKE_COOKIE_NAME)?.value))
    return jsonError(404);
  if (!requestOriginIsAllowed(request)) return jsonError(403);
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return jsonError(415);
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES)
    return jsonError(413);

  let input: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES)
      return jsonError(413);
    input = JSON.parse(raw);
  } catch {
    return jsonError(400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notificationEmail = process.env.CONTACT_NOTIFICATION_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const replyEmail = process.env.CONTACT_REPLY_EMAIL || site.email;
  if (
    !apiKey ||
    !notificationEmail ||
    !fromEmail ||
    !replyEmail ||
    !usesPbiMailDomain(fromEmail) ||
    !usesPbiMailDomain(replyEmail) ||
    !process.env.TURNSTILE_SECRET_KEY
  )
    return jsonError(503);

  const resend = new Resend(apiKey);
  const result = await processIntakeSubmission(input, {
    now: () => new Date(),
    verifyTurnstile: (token) =>
      verifyTurnstile(token, request.nextUrl.hostname),
    sendInternal: async (submission, submittedAt) => {
      const response = await resend.emails.send({
        from: fromEmail,
        to: [notificationEmail],
        replyTo: submission.email,
        ...intakeInternalEmail(submission, submittedAt),
      });
      if (response.error) throw new Error("Internal intake delivery failed");
    },
    sendConfirmation: async (submission) => {
      const response = await resend.emails.send({
        from: fromEmail,
        to: [submission.email],
        replyTo: replyEmail,
        ...intakeConfirmationEmail(submission),
      });
      if (response.error)
        throw new Error("Intake confirmation delivery failed");
    },
    logConfirmationFailure: () =>
      console.error(
        "Project intake confirmation failed after internal delivery.",
      ),
  });

  if (!result.ok)
    return NextResponse.json(
      {
        ok: false,
        message: result.message,
        errors: result.errors,
        resetTurnstile: result.resetTurnstile,
      },
      { status: result.status },
    );
  return NextResponse.json({ ok: true });
}
