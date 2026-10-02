import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { ProjectDetails } from "./schema";

export const TEMPLATE_VERSION = "pbi-2026-10-v1";
export type DocumentKind = "proposal" | "agreement" | "invoice";
const C = {
  cream: rgb(249 / 255, 243 / 255, 237 / 255),
  forest: rgb(35 / 255, 58 / 255, 48 / 255),
  gold: rgb(216 / 255, 164 / 255, 91 / 255),
  green: rgb(119 / 255, 156 / 255, 105 / 255),
  ink: rgb(31 / 255, 34 / 255, 30 / 255),
  muted: rgb(91 / 255, 98 / 255, 88 / 255),
  white: rgb(1, 1, 1),
};
const W = 612,
  H = 792,
  M = 55;
const clean = (value: string) =>
  value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/[^\x20-\x7e\n]/g, "");
const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );

function lines(text: string, font: PDFFont, size: number, maxWidth: number) {
  const output: string[] = [];
  for (const paragraph of clean(text).split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) output.push(line);
      line = word;
      while (font.widthOfTextAtSize(line, size) > maxWidth && line.length > 1) {
        let cut = line.length - 1;
        while (
          cut > 1 &&
          font.widthOfTextAtSize(line.slice(0, cut), size) > maxWidth
        )
          cut--;
        output.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
    output.push(line);
  }
  return output;
}

export async function renderPortalDocument(
  kind: DocumentKind,
  data: ProjectDetails,
  revision: number,
  invoice?: { number: string; amountCents: number; due: string },
) {
  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const lightLogo = await pdf.embedPng(
    await readFile(
      join(process.cwd(), "public", "logos", "pbi-half-lockup-dark.png"),
    ),
  );
  const darkLogo = await pdf.embedPng(
    await readFile(
      join(process.cwd(), "public", "logos", "pbi-half-lockup.png"),
    ),
  );
  let page!: PDFPage;
  let y = 0;
  const newPage = (header = true) => {
    page = pdf.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.cream });
    if (header) {
      const ratio = darkLogo.width / darkLogo.height;
      page.drawImage(darkLogo, {
        x: M,
        y: H - 76,
        width: 140,
        height: 140 / ratio,
      });
      page.drawLine({
        start: { x: M, y: H - 94 },
        end: { x: W - M, y: H - 94 },
        thickness: 1,
        color: C.gold,
      });
      y = H - 124;
    } else y = H - M;
  };
  const ensure = (height: number) => {
    if (y - height < 75) newPage();
  };
  const text = (
    content: string,
    opts: {
      font?: PDFFont;
      size?: number;
      color?: ReturnType<typeof rgb>;
      gap?: number;
      indent?: number;
      width?: number;
      leading?: number;
    } = {},
  ) => {
    const font = opts.font || sans;
    const size = opts.size || 10.5;
    const leading = opts.leading || size * 1.42;
    const wrapped = lines(
      content,
      font,
      size,
      opts.width || W - M * 2 - (opts.indent || 0),
    );
    for (const line of wrapped) {
      ensure(leading);
      page.drawText(line || " ", {
        x: M + (opts.indent || 0),
        y,
        font,
        size,
        color: opts.color || C.ink,
      });
      y -= leading;
    }
    y -= opts.gap ?? 7;
  };
  const heading = (content: string) => {
    ensure(48);
    text(content, {
      font: serifBold,
      size: 21,
      color: C.forest,
      gap: 16,
      leading: 26,
    });
  };
  const kicker = (content: string) => {
    ensure(22);
    text(content.toUpperCase(), {
      font: sansBold,
      size: 8,
      color: C.green,
      gap: 12,
      leading: 11,
    });
  };
  const row = (headingText: string, body: string, i?: number) => {
    ensure(75);
    page.drawLine({
      start: { x: M, y: y + 16 },
      end: { x: W - M, y: y + 16 },
      thickness: 0.5,
      color: C.gold,
    });
    if (i !== undefined) {
      page.drawText(String(i).padStart(2, "0"), {
        x: M,
        y: y - 18,
        size: 13,
        font: serifBold,
        color: C.green,
      });
    }
    const left = i === undefined ? 0 : 42;
    text(headingText, {
      indent: left,
      font: sansBold,
      size: 11,
      color: C.forest,
      gap: 3,
    });
    text(body, { indent: left, color: C.muted, gap: 16 });
  };

  newPage(false);
  page.drawRectangle({
    x: 0,
    y: 275,
    width: W,
    height: H - 275,
    color: C.forest,
  });
  const ratio = lightLogo.width / lightLogo.height;
  page.drawImage(lightLogo, {
    x: M,
    y: H - 125,
    width: 200,
    height: 200 / ratio,
  });
  page.drawLine({
    start: { x: M, y: H - 166 },
    end: { x: W - M, y: H - 166 },
    thickness: 1,
    color: C.gold,
  });
  page.drawText(
    clean(
      data.demo
        ? "DEMO / ILLUSTRATIVE ONLY"
        : `${kind.toUpperCase()} / REVISION ${revision}`,
    ),
    { x: M, y: H - 202, font: sansBold, size: 9, color: C.gold },
  );
  const title =
    kind === "proposal"
      ? "A practical path forward."
      : kind === "agreement"
        ? "Working together."
        : "Invoice.";
  page.drawText(title, {
    x: M,
    y: H - 274,
    font: serifBold,
    size: 32,
    color: C.white,
  });
  for (const [index, line] of lines(data.projectName, serif, 19, W - M * 2)
    .slice(0, 3)
    .entries())
    page.drawText(line, {
      x: M,
      y: H - 315 - index * 24,
      font: serif,
      size: 19,
      color: C.white,
    });
  page.drawText(`Prepared for ${clean(data.organizationName)}`, {
    x: M,
    y: 228,
    font: sansBold,
    size: 11,
    color: C.forest,
  });
  page.drawText(`Prepared by ${clean(data.preparedBy)}`, {
    x: M,
    y: 205,
    font: sans,
    size: 10,
    color: C.muted,
  });
  page.drawText(
    `Valid through ${data.proposalValidUntil}  |  Revision ${revision}`,
    { x: M, y: 181, font: sans, size: 10, color: C.muted },
  );
  if (data.demo)
    page.drawText("ILLUSTRATIVE DEMO - NOT AN OFFER OR INVOICE", {
      x: M,
      y: 114,
      font: sansBold,
      size: 9,
      color: C.green,
    });

  newPage();
  kicker(kind === "invoice" ? "Payment details" : "The opportunity");
  heading(
    kind === "invoice"
      ? `Invoice ${invoice?.number || "DRAFT"}`
      : "Built around your business.",
  );
  text(data.summary, { size: 12, gap: 20 });
  if (kind !== "invoice") {
    row("What is getting in the way", data.problem);
    row("What better looks like", data.desiredOutcome);
    heading("Scope of work");
    data.scope.forEach((item, i) => row(item.heading, item.description, i + 1));
    heading("Deliverables");
    data.deliverables.forEach((item) => text(`- ${item}`, { gap: 2 }));
    y -= 12;
    heading("Outside this scope");
    data.exclusions.forEach((item) => text(`- ${item}`, { gap: 2 }));
    y -= 12;
  }
  heading(kind === "invoice" ? "Amount due" : "Investment");
  ensure(120);
  page.drawRectangle({
    x: M,
    y: y - 92,
    width: W - M * 2,
    height: 105,
    color: C.forest,
  });
  page.drawText(
    kind === "invoice"
      ? "TOTAL DUE"
      : data.pricing.model === "monthly"
        ? "MONTHLY INVESTMENT"
        : "PROJECT INVESTMENT",
    { x: M + 20, y: y - 15, font: sansBold, size: 8, color: C.gold },
  );
  page.drawText(usd(invoice?.amountCents ?? data.pricing.amountCents), {
    x: M + 20,
    y: y - 64,
    font: serifBold,
    size: 30,
    color: C.white,
  });
  y -= 122;
  text(
    kind === "invoice" ? `For ${data.projectName}` : data.pricing.description,
    { color: C.muted, gap: 18 },
  );
  if (invoice)
    row("Invoice balance", `${usd(invoice.amountCents)} - due ${invoice.due}`);
  else
    for (const part of data.paymentSchedule)
      row(part.label, `${usd(part.amountCents)} - ${part.due}`);
  if (kind !== "invoice") {
    heading("Timing and assumptions");
    text(
      `Estimated start: ${data.estimatedStart}${data.estimatedEnd ? `   Estimated end: ${data.estimatedEnd}` : ""}`,
    );
    data.assumptions.forEach((item) => text(`- ${item}`, { gap: 2 }));
  }
  if (kind === "agreement") {
    y -= 12;
    heading("Proposed terms");
    text("UNREVIEWED TERMS - DEMO ONLY", { font: sansBold, color: C.green });
    data.terms.forEach((term) => row(term.heading, term.body));
    for (const signer of data.authorizedSigners) {
      newPage();
      kicker("Authorized acceptance");
      heading(`Signature for ${signer.name}`);
      text(
        "Complete the fields below through the signing provider. The approved agreement version is fixed before signing.",
        { gap: 28 },
      );
      row(
        "Signer name",
        "____________________________________________________________",
      );
      row(
        "Title",
        "____________________________________________________________",
      );
      row(
        "Signature",
        "____________________________________________________________",
      );
      row(
        "Date",
        "____________________________________________________________",
      );
    }
    if (data.requiresPbiSignature) {
      newPage();
      kicker("PBI acceptance");
      heading("Pierce Business Group LLC");
      text("Doing business as Pierce Business Integrations", { gap: 28 });
      row(
        "Authorized name and title",
        "____________________________________________________________",
      );
      row(
        "Signature",
        "____________________________________________________________",
      );
      row(
        "Date",
        "____________________________________________________________",
      );
    }
  } else if (kind === "proposal") {
    y -= 12;
    heading("Next steps");
    text(
      "Review this proposal together, confirm any open details, and approve the exact agreement before signing.",
    );
  }
  const pages = pdf.getPages();
  pages.forEach((p, index) => {
    p.drawLine({
      start: { x: M, y: 57 },
      end: { x: W - M, y: 57 },
      thickness: 0.5,
      color: C.gold,
    });
    p.drawText(
      "PIERCE BUSINESS INTEGRATIONS  /  MODERN SOLUTIONS. LOCAL PARTNERSHIP.",
      { x: M, y: 39, font: sans, size: 7, color: C.muted },
    );
    p.drawText(`${index + 1} / ${pages.length}`, {
      x: W - M - 28,
      y: 39,
      font: sans,
      size: 7,
      color: C.muted,
    });
  });
  return Buffer.from(await pdf.save());
}
