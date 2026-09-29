import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  processContactSubmission,
  type ContactDependencies,
} from "../src/lib/contact-service";
import { requestOriginIsAllowed } from "../src/app/api/contact/route";
import { confirmationEmail, internalEmail } from "../src/lib/contact-emails";
import { usesPbiMailDomain } from "../src/lib/mail-domain";
import { processStoredLead } from "../src/lib/lead-conversion";

const now = new Date("2026-07-11T16:00:00.000Z");
const valid = {
  firstName: "Jacob",
  lastName: "Pierce",
  email: "JACOB@example.com",
  phone: "",
  business: "Pierce Business Integrations",
  website: "https://example.com",
  service: "New Website",
  budget: "$3,000–$5,499",
  timeline: "Within 1–2 months",
  message: "I would like to discuss a new website project.",
  referral: "Google Search",
  consent: true,
  honeypot: "",
  turnstileToken: "valid-token",
  formStartedAt: now.getTime() - 5000,
  landingPage: "/",
  currentPage: "/contact",
  referrer: "",
  utmSource: "search",
  utmMedium: "cpc",
  utmCampaign: "north-georgia",
  utmTerm: "",
  utmContent: "",
  gclid: "",
  msclkid: "",
  fbclid: "",
};

function dependencies(
  overrides: Partial<ContactDependencies> = {},
): ContactDependencies {
  return {
    now: () => now,
    verifyTurnstile: async () => true,
    sendInternal: async () => {},
    sendConfirmation: async () => {},
    ...overrides,
  };
}

test("valid submission succeeds and normalizes email", async () => {
  const result = await processContactSubmission(valid, dependencies());
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.submission.email, "jacob@example.com");
});

test("an operational problem and substantial system budget can be submitted", async () => {
  const result = await processContactSubmission(
    {
      ...valid,
      service: "Operational Problem / Not Sure What Solution",
      budget: "$15,000–$24,999",
      message:
        "Our team repeats the same handoffs across three tools each day.",
    },
    dependencies(),
  );
  assert.equal(result.ok, true);
});

test("optional attribution and contact fields may be omitted", async () => {
  const {
    phone,
    website,
    referral,
    landingPage,
    referrer,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    gclid,
    msclkid,
    fbclid,
    ...withoutOptionalFields
  } = valid;
  void [
    phone,
    website,
    referral,
    landingPage,
    referrer,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    gclid,
    msclkid,
    fbclid,
  ];

  const result = await processContactSubmission(
    withoutOptionalFields,
    dependencies(),
  );
  assert.equal(result.ok, true, JSON.stringify(result));
});

for (const [name, input, field] of [
  ["missing required field", { ...valid, firstName: " " }, "firstName"],
  ["invalid email", { ...valid, email: "not-an-email" }, "email"],
  ["invalid URL", { ...valid, website: "example" }, "website"],
  ["oversized message", { ...valid, message: "x".repeat(5001) }, "message"],
  ["invalid service", { ...valid, service: "Anything at all" }, "service"],
  ["missing consent", { ...valid, consent: false }, "consent"],
] as const) {
  test(name, async () => {
    const result = await processContactSubmission(input, dependencies());
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.errors?.[field]);
  });
}

test("honeypot submission fails before provider calls", async () => {
  let verified = false;
  const result = await processContactSubmission(
    { ...valid, honeypot: "bot" },
    dependencies({
      verifyTurnstile: async () => {
        verified = true;
        return true;
      },
    }),
  );
  assert.equal(result.ok, false);
  assert.equal(verified, false);
});

test("unrealistically fast submission fails", async () => {
  const result = await processContactSubmission(
    { ...valid, formStartedAt: now.getTime() - 100 },
    dependencies(),
  );
  assert.equal(result.ok, false);
});

test("invalid Turnstile token fails", async () => {
  const result = await processContactSubmission(
    valid,
    dependencies({ verifyTurnstile: async () => false }),
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.resetTurnstile, true);
});

test("internal email failure returns failure", async () => {
  const result = await processContactSubmission(
    valid,
    dependencies({
      sendInternal: async () => {
        throw new Error("provider failed");
      },
    }),
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 502);
});

test("confirmation failure does not reject an accepted inquiry", async () => {
  let logged = false;
  const result = await processContactSubmission(
    valid,
    dependencies({
      sendConfirmation: async () => {
        throw new Error("confirmation failed");
      },
      logConfirmationFailure: () => {
        logged = true;
      },
    }),
  );
  assert.equal(result.ok, true);
  assert.equal(logged, true);
});

test("origin validation accepts local same-origin and rejects an unapproved origin", () => {
  const accepted = new NextRequest("http://localhost:3000/api/contact", {
    method: "POST",
    headers: { host: "localhost:3000", origin: "http://localhost:3000" },
  });
  const rejected = new NextRequest("http://localhost:3000/api/contact", {
    method: "POST",
    headers: { host: "localhost:3000", origin: "https://example.net" },
  });
  assert.equal(requestOriginIsAllowed(accepted), true);
  assert.equal(requestOriginIsAllowed(rejected), false);
});

test("HTML email escapes visitor content", () => {
  const email = internalEmail(
    { ...valid, firstName: "<script>alert(1)</script>" } as never,
    now,
  );
  assert.equal(email.html.includes("<script>alert(1)</script>"), false);
  assert.equal(email.html.includes("&lt;script&gt;"), true);
});

test("confirmation email includes the branded Jacob Pierce signature", () => {
  const email = confirmationEmail(valid as never);
  assert.equal(
    email.html.includes(
      "https://piercebusinessintegrations.com/logos/pbi-icon-color.png",
    ),
    true,
  );
  assert.equal(email.html.includes("Founder &amp; Solutions Architect"), true);
  assert.equal(
    email.html.includes("Modern solutions. Local partnership."),
    true,
  );
  assert.equal(email.html.includes("@piercebusinessintegrations.com"), false);
});

test("outbound sender configuration requires the PBI mail domain", () => {
  assert.equal(
    usesPbiMailDomain(
      "Pierce Business Integrations <inquiries@pbintegrations.com>",
    ),
    true,
  );
  assert.equal(usesPbiMailDomain("reply@pbintegrations.com"), true);
  assert.equal(usesPbiMailDomain("contact@piercewebsolutions.com"), false);
  assert.equal(usesPbiMailDomain("reply@pbintegrations.com.invalid"), false);
});

test("direct thank-you visits do not send a lead event", () => {
  let sent = 0;
  const storage = { getItem: () => null, removeItem: () => {} };
  assert.equal(
    processStoredLead(
      storage,
      () => {
        sent += 1;
        return true;
      },
      now.getTime(),
    ),
    "missing",
  );
  assert.equal(sent, 0);
});

test("a successful lead marker sends exactly once", () => {
  let stored: string | null = JSON.stringify({
    createdAt: now.getTime(),
    serviceInterest: "New Website",
    estimatedBudget: "$3,000–$5,499",
    leadSource: "search",
  });
  let sent = 0;
  const storage = {
    getItem: () => stored,
    removeItem: () => {
      stored = null;
    },
  };
  const sender = () => {
    sent += 1;
    return true;
  };
  assert.equal(processStoredLead(storage, sender, now.getTime()), "sent");
  assert.equal(processStoredLead(storage, sender, now.getTime()), "missing");
  assert.equal(sent, 1);
});
