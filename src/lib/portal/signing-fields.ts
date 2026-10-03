import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import { z } from "zod";
export const SIGNING_FIELDS_KEY = "PBISigningFields";
export const signingFieldSchema = z.object({
  api_id: z.string(),
  recipient_id: z.string(),
  type: z.enum(["text", "signature", "date"]),
  page: z.number().int().positive(),
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  required: z.literal(true),
  lock_sign_date: z.boolean().optional(),
});
export type SigningField = z.infer<typeof signingFieldSchema>;
export async function readSigningFields(bytes: Uint8Array) {
  const pdf = await PDFDocument.load(bytes);
  const metadata = pdf.catalog.get(PDFName.of(SIGNING_FIELDS_KEY));
  if (!(metadata instanceof PDFString))
    throw new Error(
      "Generate a new agreement revision before preparing SignWell signing",
    );
  const fields = z
    .array(signingFieldSchema)
    .min(1)
    .parse(JSON.parse(metadata.decodeText()));
  for (const field of fields) {
    const page =
      field.page <= pdf.getPageCount() ? pdf.getPage(field.page - 1) : null;
    if (
      !page ||
      field.x + field.width > (page.getWidth() * 96) / 72 ||
      field.y + field.height > (page.getHeight() * 96) / 72
    )
      throw new Error("Signing fields extend outside the agreement page");
  }
  return fields;
}
