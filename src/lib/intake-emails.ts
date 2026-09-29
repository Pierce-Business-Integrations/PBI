import type { IntakeSubmission } from "./intake-schema";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const display = (value?: string) => value || "Not provided";
const cleanSubject = (value: string) => value.replace(/[\r\n]+/g, " ");

const sections = (submission: IntakeSubmission) =>
  [
    {
      title: "Contact and business",
      rows: [
        ["Contact", `${submission.firstName} ${submission.lastName}`],
        ["Email", submission.email],
        ["Phone", submission.phone],
        ["Business", submission.business],
        ["Role", submission.role],
        ["Website", submission.website],
        ["Industry", submission.industry],
        ["Team size", submission.teamSize],
        ["Service area", submission.serviceArea],
      ],
    },
    {
      title: "Project overview",
      rows: [
        ["Areas of interest", submission.interests.join(", ")],
        ["Business overview", submission.businessOverview],
        ["Project summary", submission.projectSummary],
        ["Current situation", submission.currentSituation],
        ["Problem or pain points", submission.painPoints],
        ["Business impact", submission.businessImpact],
        ["Desired outcome", submission.desiredOutcome],
        ["Measures of success", submission.successMeasures],
      ],
    },
    {
      title: "Systems and operations",
      rows: [
        ["Existing tools", submission.existingTools],
        ["Users and roles", submission.usersAndRoles],
        ["Data and integrations", submission.dataAndIntegrations],
        ["Technical or policy constraints", submission.constraints],
        ["Workflow details", submission.workflowDetails],
        ["Workflow volume", submission.workflowVolume],
        ["Exceptions and approvals", submission.exceptionsAndApprovals],
        ["AI considerations", submission.aiConsiderations],
      ],
    },
    {
      title: "Website and care",
      rows: [
        ["Website goals", submission.websiteGoals],
        ["Audience", submission.websiteAudience],
        ["Content readiness", submission.websiteContent],
        ["Features", submission.websiteFeatures],
        ["Care needs", submission.websiteCareNeeds],
        ["Current hosting", submission.currentHosting],
      ],
    },
    {
      title: "Advertising",
      rows: [
        ["Channels and history", submission.adChannels],
        ["Target market", submission.targetMarket],
        ["Monthly ad spend", submission.monthlyAdSpend],
        ["Qualified lead", submission.qualifiedLead],
        ["Tracking", submission.adTracking],
      ],
    },
    {
      title: "Engagement details",
      rows: [
        ["Budget", submission.budget],
        ["Timeline", submission.timeline],
        ["Decision makers", submission.decisionMakers],
        ["Supporting materials", submission.supportingMaterials],
        ["Additional context", submission.additionalContext],
      ],
    },
  ] as const;

const rowHtml = (label: string, value: string | undefined) =>
  `<tr><th style="width:180px;padding:10px 18px 10px 0;text-align:left;vertical-align:top;color:#5D6E5E;font:600 11px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(label)}</th><td style="padding:10px 0;color:#1F1F1D;font:14px Arial,sans-serif;line-height:1.6;white-space:pre-wrap;word-break:break-word">${escapeHtml(display(value))}</td></tr>`;

export function intakeInternalEmail(
  submission: IntakeSubmission,
  submittedAt: Date,
) {
  const submitted =
    submittedAt.toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " ET";
  const groups = sections(submission);
  const htmlSections = groups
    .map(
      ({ title, rows }) =>
        `<div style="margin-top:26px;border-top:1px solid #d9d0c3;padding-top:20px"><h2 style="margin:0 0 8px;color:#1F1F1D;font:22px Georgia,serif">${escapeHtml(title)}</h2><table style="width:100%;border-collapse:collapse">${rows.map(([label, value]) => rowHtml(label, value)).join("")}</table></div>`,
    )
    .join("");
  const text = groups
    .map(
      ({ title, rows }) =>
        `${title.toUpperCase()}\n${rows.map(([label, value]) => `${label}: ${display(value)}`).join("\n")}`,
    )
    .join("\n\n");

  return {
    subject: `Project Intake: ${cleanSubject(submission.business)}`,
    html: `<!doctype html><html><body style="margin:0;background:#efe8dc;padding:28px"><div style="max-width:760px;margin:auto;background:#F7F3ED;border:1px solid #d7c7aa"><div style="padding:26px 30px;background:#1F1F1D;color:#F7F3ED"><p style="margin:0;color:#A8B6A6;font:600 11px Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase">Pierce Business Integrations</p><h1 style="margin:10px 0 0;font:28px Georgia,serif">New project intake</h1><p style="margin:8px 0 0;color:#d8d3ca;font:13px Arial,sans-serif">Submitted ${escapeHtml(submitted)}</p></div><div style="padding:8px 30px 30px">${htmlSections}</div></div></body></html>`,
    text: `NEW PBI PROJECT INTAKE\nSubmitted: ${submitted}\n\n${text}`,
  };
}

export function intakeConfirmationEmail(submission: IntakeSubmission) {
  return {
    subject: "We received your project intake | Pierce Business Integrations",
    html: `<!doctype html><html><body style="margin:0;background:#efe8dc;padding:28px"><div style="max-width:620px;margin:auto;background:#F7F3ED;border:1px solid #d7c7aa"><div style="padding:26px 30px;background:#1F1F1D;color:#F7F3ED"><p style="margin:0;color:#A8B6A6;font:600 11px Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase">Pierce Business Integrations</p><h1 style="margin:10px 0 0;font:28px Georgia,serif">Project intake received.</h1></div><div style="padding:28px 30px;color:#3a3a37;font:15px Arial,sans-serif;line-height:1.75"><p>Hi ${escapeHtml(submission.firstName)},</p><p>Thank you for completing the project intake. I’ve received the details for ${escapeHtml(submission.business)} and will review them before we discuss the next step.</p><p>If anything changes, reply to this email so I can keep the intake current.</p><p style="margin-top:30px">Thanks,<br><strong>Jacob Pierce</strong><br>Pierce Business Integrations</p></div></div></body></html>`,
    text: `Hi ${submission.firstName},\n\nThank you for completing the project intake. I’ve received the details for ${submission.business} and will review them before we discuss the next step.\n\nIf anything changes, reply to this email so I can keep the intake current.\n\nThanks,\nJacob Pierce\nPierce Business Integrations`,
  };
}
