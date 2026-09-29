import type { ContactSubmission } from "./contact-schema";
import { site } from "./site";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const display = (value?: string) => value || "Not provided";

const confirmationSignature = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:#1f1f1d">
  <tr>
    <td style="padding-right:18px;vertical-align:top">
      <img src="${site.url}/logos/pbi-icon-color.png" alt="Pierce Business Integrations" width="65" style="display:block;width:65px;height:auto;border:0">
    </td>
    <td style="border-left:2px solid #b89456;padding-left:18px;vertical-align:top">
      <div style="font-size:17px;line-height:21px;font-weight:700;color:#1f1f1d">Jacob Pierce</div>
      <div style="font-size:12px;line-height:18px;color:#8e8578">Founder &amp; Solutions Architect</div>
      <div style="margin-top:3px;font-size:13px;line-height:18px;font-weight:700;color:#1f1f1d">Pierce Business Integrations</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:12px;line-height:18px;font-style:italic;color:#8e8578">${site.tagline}</div>
      <div style="margin-top:9px;font-size:12px;line-height:19px;color:#1f1f1d">
        ${site.email ? `<a href="mailto:${escapeHtml(site.email)}" style="color:#5d6e5e;text-decoration:none">${escapeHtml(site.email)}</a><span style="color:#b89456"> &nbsp;|&nbsp; </span>` : ""}
        <a href="${site.url}" style="color:#5d6e5e;text-decoration:none">piercebusinessintegrations.com</a>
      </div>
    </td>
  </tr>
</table>`;

export function internalEmail(
  submission: ContactSubmission,
  submittedAt: Date,
) {
  const name = `${submission.firstName} ${submission.lastName}`;
  const attribution = [
    ["Landing page", submission.landingPage],
    ["Current page", submission.currentPage],
    ["Referrer", submission.referrer],
    ["UTM source", submission.utmSource],
    ["UTM medium", submission.utmMedium],
    ["UTM campaign", submission.utmCampaign],
    ["UTM term", submission.utmTerm],
    ["UTM content", submission.utmContent],
    ["GCLID", submission.gclid],
    ["MSCLKID", submission.msclkid],
    ["FBCLID", submission.fbclid],
  ] as const;
  const details = [
    ["Contact", name],
    ["Email", submission.email],
    ["Phone", submission.phone],
    ["Business", submission.business],
    ["Current website", submission.website],
    ["Likely starting point", submission.service],
    ["Estimated budget", submission.budget],
    ["Desired timeline", submission.timeline],
    ["Referral source", submission.referral],
    [
      "Submitted",
      submittedAt.toLocaleString("en-US", {
        timeZone: "America/New_York",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " ET",
    ],
  ] as const;
  const rows = (items: readonly (readonly [string, string | undefined])[]) =>
    items
      .map(
        ([label, value]) =>
          `<tr><th style="padding:10px 16px 10px 0;text-align:left;vertical-align:top;color:#5D6E5E;font:600 11px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(label)}</th><td style="padding:10px 0;color:#1F1F1D;font:14px Arial,sans-serif;line-height:1.5;word-break:break-word">${escapeHtml(display(value))}</td></tr>`,
      )
      .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#efe8dc;padding:28px"><div style="max-width:680px;margin:auto;background:#F7F3ED;border:1px solid #d7c7aa"><div style="padding:26px 30px;background:#1F1F1D;color:#F7F3ED"><p style="margin:0;color:#A8B6A6;font:600 11px Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase">Pierce Business Integrations</p><h1 style="margin:10px 0 0;font:28px Georgia,serif">New consultation inquiry</h1></div><div style="padding:24px 30px"><table style="width:100%;border-collapse:collapse">${rows(details)}</table><div style="margin:22px 0;border-top:1px solid #d9d0c3"></div><p style="color:#5D6E5E;font:600 11px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase">Message</p><p style="white-space:pre-wrap;color:#1F1F1D;font:15px Arial,sans-serif;line-height:1.7">${escapeHtml(submission.message)}</p><div style="margin:22px 0;border-top:1px solid #d9d0c3"></div><p style="color:#5D6E5E;font:600 11px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase">Attribution</p><table style="width:100%;border-collapse:collapse">${rows(attribution)}</table></div></div></body></html>`;
  const textRows = [
    ...details,
    ["Message", submission.message] as const,
    ...attribution,
  ]
    .map(([label, value]) => `${label}: ${display(value)}`)
    .join("\n");
  return {
    subject: `New PBI Inquiry: ${(submission.business || name).replace(/[\r\n]+/g, " ")}`,
    html,
    text: `NEW PBI CONSULTATION INQUIRY\n\n${textRows}`,
  };
}

export function confirmationEmail(submission: ContactSubmission) {
  const html = `<!doctype html><html><body style="margin:0;background:#efe8dc;padding:28px"><div style="max-width:620px;margin:auto;background:#F7F3ED;border:1px solid #d7c7aa"><div style="padding:26px 30px;background:#1F1F1D;color:#F7F3ED"><p style="margin:0;color:#A8B6A6;font:600 11px Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase">Pierce Business Integrations</p><h1 style="margin:10px 0 0;font:28px Georgia,serif">Thank you for reaching out.</h1></div><div style="padding:28px 30px;color:#3a3a37;font:15px Arial,sans-serif;line-height:1.75"><p>Hi ${escapeHtml(submission.firstName)},</p><p>Thank you for contacting Pierce Business Integrations. I’ve received the information you submitted and will review it personally.</p><p>You can expect a response within one business day.</p><p>In the meantime, no further action is required.</p><div style="margin-top:30px">${confirmationSignature}</div></div></div></body></html>`;
  const text = `Hi ${submission.firstName},

Thank you for contacting Pierce Business Integrations. I’ve received the information you submitted and will review it personally.

You can expect a response within one business day.

In the meantime, no further action is required.

Thanks,
Jacob Pierce
Founder & Solutions Architect
Pierce Business Integrations
${site.email ? `${site.email}\n` : ""}
piercebusinessintegrations.com`;
  return {
    subject: "We received your inquiry | Pierce Business Integrations",
    html,
    text,
  };
}
