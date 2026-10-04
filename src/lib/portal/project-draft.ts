import type { ProjectDetails } from "./schema";

// Client drafts deliberately contain no example prices, dates, scope, or legal clauses.
export function emptyProjectDraft(): ProjectDetails {
  return {
    label: "",
    organizationName: "",
    contactName: "",
    contactEmail: "",
    authorizedSigners: [{ name: "", email: "", title: "", order: 1 }],
    projectName: "",
    summary: "",
    problem: "",
    desiredOutcome: "",
    scope: [{ heading: "", description: "" }],
    deliverables: [],
    exclusions: [],
    pricing: {
      currency: "usd",
      model: "fixed",
      amountCents: 0,
      description: "",
    },
    paymentSchedule: [],
    estimatedStart: "",
    proposalValidUntil: "",
    assumptions: [],
    terms: [],
    requiresPbiSignature: true,
    preparedBy: "Jacob Pierce",
    demo: false,
  };
}
