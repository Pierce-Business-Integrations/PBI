import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET as grantIntakeAccess } from "../src/app/api/intake/access/route";
import { processIntakeSubmission } from "../src/lib/intake-service";
import {
  intakeConfirmationEmail,
  intakeInternalEmail,
} from "../src/lib/intake-emails";
import {
  intakeSessionIsValid,
  intakeSessionValue,
  inviteTokenIsValid,
} from "../src/lib/intake-access";

const now = new Date("2026-09-15T15:00:00.000Z");
const valid = {
  firstName: "Avery",
  lastName: "Client",
  email: "AVERY@example.com",
  phone: "",
  business: "North Georgia Services",
  role: "Owner",
  website: "https://example.com",
  industry: "Professional services",
  teamSize: "2–10 people",
  serviceArea: "North Georgia",
  interests: [
    "Custom business system or web application",
    "Website design or redesign",
  ],
  businessOverview: "We coordinate field service work for local customers.",
  projectSummary:
    "We need a clearer website and a system for managing incoming work.",
  currentSituation:
    "Requests arrive through email and are copied into a spreadsheet.",
  painPoints: "Details are missed and staff repeat the same data entry.",
  businessImpact: "Several hours per week are lost.",
  desiredOutcome:
    "A dependable intake and scheduling workflow with a clearer website.",
  successMeasures: "Fewer errors and faster response time.",
  existingTools: "Google Workspace and spreadsheets",
  usersAndRoles: "Three office staff and five field users",
  dataAndIntegrations: "Email and accounting platform",
  constraints: "Must work well on phones",
  websiteGoals: "Explain services and capture qualified requests",
  websiteAudience: "Property managers",
  websiteContent: "Logo and draft copy available",
  websiteFeatures: "Project inquiry form",
  websiteCareNeeds: "Ongoing updates",
  currentHosting: "Current provider unknown",
  adChannels: "",
  targetMarket: "",
  monthlyAdSpend: "",
  qualifiedLead: "",
  adTracking: "",
  workflowDetails: "A request is reviewed, scheduled, assigned, and closed.",
  workflowVolume: "About 100 requests monthly",
  exceptionsAndApprovals: "Large jobs need owner approval",
  aiConsiderations: "Not required",
  budget: "$15,000–$24,999",
  timeline: "Within 3–4 months",
  decisionMakers: "Owner and operations manager",
  supportingMaterials: "",
  additionalContext: "",
  consent: true,
  honeypot: "",
  turnstileToken: "valid-token",
  formStartedAt: now.getTime() - 60_000,
};

const dependencies = {
  now: () => now,
  verifyTurnstile: async () => true,
  sendInternal: async () => {},
  sendConfirmation: async () => {},
};

test("valid comprehensive intake is accepted and normalizes email", async () => {
  const result = await processIntakeSubmission(valid, dependencies);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.submission.email, "avery@example.com");
});

test("intake requires at least one project interest", async () => {
  const result = await processIntakeSubmission(
    { ...valid, interests: [] },
    dependencies,
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(Boolean(result.errors?.interests), true);
});

test("internal intake email groups answers and escapes visitor content", () => {
  const message = intakeInternalEmail(
    {
      ...valid,
      projectSummary: "<script>alert(1)</script> A detailed project request.",
    } as never,
    now,
  );
  assert.equal(message.subject, "Project Intake: North Georgia Services");
  assert.equal(message.html.includes("<script>alert(1)</script>"), false);
  assert.equal(
    message.html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"),
    true,
  );
  assert.equal(message.html.includes("Systems and operations"), true);
  assert.equal(message.text.includes("Website goals"), true);
});

test("intake confirmation identifies the business", () => {
  const message = intakeConfirmationEmail(valid as never);
  assert.equal(message.html.includes("North Georgia Services"), true);
  assert.equal(message.text.includes("Avery"), true);
});

test("intake invite and derived session reject the wrong secret", () => {
  const before = process.env.PROJECT_INTAKE_ACCESS_TOKEN;
  const token = "0123456789abcdef0123456789abcdef0123456789abcdef";
  process.env.PROJECT_INTAKE_ACCESS_TOKEN = token;
  try {
    assert.equal(inviteTokenIsValid(token), true);
    assert.equal(inviteTokenIsValid(`${token}wrong`), false);
    const session = intakeSessionValue();
    assert.equal(Boolean(session), true);
    assert.equal(intakeSessionIsValid(session), true);
    assert.equal(intakeSessionIsValid("wrong-session"), false);
  } finally {
    if (before === undefined) delete process.env.PROJECT_INTAKE_ACCESS_TOKEN;
    else process.env.PROJECT_INTAKE_ACCESS_TOKEN = before;
  }
});

test("email invite grants a Lax cookie before redirecting", () => {
  const before = process.env.PROJECT_INTAKE_ACCESS_TOKEN;
  const token = "abcdef0123456789abcdef0123456789abcdef0123456789";
  process.env.PROJECT_INTAKE_ACCESS_TOKEN = token;
  try {
    const response = grantIntakeAccess(
      new NextRequest(
        `https://piercebusinessintegrations.com/api/intake/access?token=${token}`,
      ),
    );
    const cookie = response.headers.get("set-cookie") || "";
    assert.equal(response.status, 303);
    assert.equal(
      response.headers.get("location"),
      "https://piercebusinessintegrations.com/project-intake",
    );
    assert.match(cookie, /SameSite=lax/i);
    assert.match(cookie, /HttpOnly/i);
  } finally {
    if (before === undefined) delete process.env.PROJECT_INTAKE_ACCESS_TOKEN;
    else process.env.PROJECT_INTAKE_ACCESS_TOKEN = before;
  }
});
