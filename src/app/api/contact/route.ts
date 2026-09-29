import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/lib/site";
import { internalEmail, confirmationEmail } from "@/lib/contact-emails";
import { processContactSubmission } from "@/lib/contact-service";
import { usesPbiMailDomain } from "@/lib/mail-domain";
import { track } from "@vercel/analytics/server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 64 * 1024;
const genericError =
  "We couldn’t send your inquiry right now. Please try again later.";

type TurnstileResponse = {
  success: boolean;
  hostname?: string;
};

function allowedHosts(): Set<string> {
  const hosts = new Set<string>();
  for (const url of [site.url, process.env.NEXT_PUBLIC_SITE_URL]) {
    if (!url) continue;
    try {
      const host = new URL(url).host.toLowerCase();
      hosts.add(host);
      // Vercel may serve either hostname before the canonical redirect.
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

export function requestOriginIsAllowed(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host")?.toLowerCase();
  if (!origin || !host) return false;
  try {
    const originUrl = new URL(origin);
    const allowed = allowedHosts();
    return allowed.has(originUrl.host.toLowerCase()) && allowed.has(host);
  } catch {
    return false;
  }
}

async function verifyTurnstile(
  token: string,
  expectedHostname: string,
): Promise<boolean> {
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
  if (!result.success) return false;
  if (
    process.env.NODE_ENV === "production" &&
    result.hostname &&
    result.hostname.toLowerCase() !== expectedHostname.toLowerCase()
  )
    return false;
  return true;
}

export async function POST(request: NextRequest) {
  if (!requestOriginIsAllowed(request))
    return NextResponse.json(
      { ok: false, message: genericError },
      { status: 403 },
    );
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return NextResponse.json(
      { ok: false, message: genericError },
      { status: 415 },
    );
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES)
    return NextResponse.json(
      { ok: false, message: genericError },
      { status: 413 },
    );

  let input: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES)
      throw new Error("Body too large");
    input = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, message: genericError },
      { status: 400 },
    );
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
  ) {
    console.error("Contact form configuration is incomplete.");
    return NextResponse.json(
      { ok: false, message: genericError },
      { status: 503 },
    );
  }
  const resend = new Resend(apiKey);
  const result = await processContactSubmission(input, {
    now: () => new Date(),
    verifyTurnstile: (token) =>
      verifyTurnstile(token, request.nextUrl.hostname),
    sendInternal: async (submission, submittedAt) => {
      const email = internalEmail(submission, submittedAt);
      const response = await resend.emails.send({
        from: fromEmail,
        to: [notificationEmail],
        replyTo: submission.email,
        ...email,
      });
      if (response.error) {
        console.error("Contact inquiry delivery failed.", response.error);
        throw new Error("Internal delivery failed");
      }
    },
    sendConfirmation: async (submission) => {
      const email = confirmationEmail(submission);
      const response = await resend.emails.send({
        from: fromEmail,
        to: [submission.email],
        replyTo: replyEmail,
        ...email,
      });
      if (response.error) {
        console.error("Contact confirmation delivery failed.", response.error);
        throw new Error("Confirmation delivery failed");
      }
    },
    logConfirmationFailure: () =>
      console.error(
        "Contact confirmation email delivery failed after inquiry acceptance.",
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
  try {
    await track("Inquiry Accepted", {
      service: result.submission.service,
      budget: result.submission.budget,
      source: result.submission.utmSource || "direct",
    });
  } catch {
    console.error("Vercel inquiry analytics delivery failed.");
  }
  return NextResponse.json({
    ok: true,
    lead: {
      serviceInterest: result.submission.service,
      estimatedBudget: result.submission.budget,
      leadSource: result.submission.utmSource || "direct",
    },
  });
}
