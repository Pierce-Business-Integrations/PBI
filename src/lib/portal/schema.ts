import { z } from "zod";

const nonempty = z.string().trim().min(1);
const isoDate = z.iso.date();

export const projectDetailsSchema = z
  .object({
    label: nonempty,
    organizationName: nonempty,
    contactName: nonempty,
    contactEmail: z.email(),
    authorizedSigners: z
      .array(
        z.object({
          name: nonempty,
          email: z.email(),
          title: nonempty,
          order: z.number().int().positive(),
        }),
      )
      .min(1),
    projectName: nonempty,
    summary: nonempty,
    problem: nonempty,
    desiredOutcome: nonempty,
    scope: z
      .array(z.object({ heading: nonempty, description: nonempty }))
      .min(1),
    deliverables: z.array(nonempty).min(1),
    exclusions: z.array(nonempty).min(1),
    pricing: z.object({
      currency: z.literal("usd"),
      model: z.enum(["fixed", "monthly"]),
      amountCents: z.number().int().positive(),
      description: nonempty,
    }),
    paymentSchedule: z
      .array(
        z.object({
          label: nonempty,
          amountCents: z.number().int().positive(),
          due: nonempty,
        }),
      )
      .min(1),
    estimatedStart: isoDate,
    estimatedEnd: isoDate.optional(),
    proposalValidUntil: isoDate,
    assumptions: z.array(nonempty),
    terms: z.array(z.object({ heading: nonempty, body: nonempty })).min(1),
    requiresPbiSignature: z.boolean(),
    preparedBy: nonempty,
    demo: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.estimatedEnd && data.estimatedEnd < data.estimatedStart)
      ctx.addIssue({
        code: "custom",
        path: ["estimatedEnd"],
        message: "End date must follow the start date",
      });
    if (
      data.pricing.model === "fixed" &&
      data.paymentSchedule.reduce((sum, part) => sum + part.amountCents, 0) !==
        data.pricing.amountCents
    )
      ctx.addIssue({
        code: "custom",
        path: ["paymentSchedule"],
        message: "Fixed-price schedule must total the project price",
      });
    const emails = data.authorizedSigners.map((signer) =>
      signer.email.toLowerCase(),
    );
    if (new Set(emails).size !== emails.length)
      ctx.addIssue({
        code: "custom",
        path: ["authorizedSigners"],
        message: "Signer email addresses must be unique",
      });
  });

export type ProjectDetails = z.infer<typeof projectDetailsSchema>;

export function parseProjectDetails(input: unknown): ProjectDetails {
  return projectDetailsSchema.parse(input);
}

export function formatValidationError(error: unknown): string {
  if (!(error instanceof z.ZodError))
    return error instanceof Error ? error.message : "Invalid project details";
  return error.issues
    .map((issue) => `${issue.path.join(".") || "project"}: ${issue.message}`)
    .join("; ");
}
