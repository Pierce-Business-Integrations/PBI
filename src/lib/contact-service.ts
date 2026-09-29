import {
  contactSchema,
  fieldErrors,
  type ContactSubmission,
} from "./contact-schema";

export type ContactDependencies = {
  now: () => Date;
  verifyTurnstile: (token: string) => Promise<boolean>;
  sendInternal: (
    submission: ContactSubmission,
    submittedAt: Date,
  ) => Promise<void>;
  sendConfirmation: (submission: ContactSubmission) => Promise<void>;
  logConfirmationFailure?: () => void;
};

export type ContactResult =
  | { ok: true; submission: ContactSubmission }
  | {
      ok: false;
      status: number;
      errors?: Record<string, string>;
      message: string;
      resetTurnstile?: boolean;
    };

const genericError =
  "We couldn’t send your inquiry right now. Please try again later.";

export async function processContactSubmission(
  input: unknown,
  dependencies: ContactDependencies,
): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      errors: fieldErrors(parsed.error),
      message: "Please review the highlighted fields.",
    };
  }

  const submission = parsed.data;
  const now = dependencies.now();
  const completionTime = now.getTime() - submission.formStartedAt;
  if (
    submission.honeypot ||
    completionTime < 2500 ||
    completionTime > 4 * 60 * 60 * 1000
  ) {
    return {
      ok: false,
      status: 400,
      message: genericError,
      resetTurnstile: true,
    };
  }

  let turnstileValid = false;
  try {
    turnstileValid = await dependencies.verifyTurnstile(
      submission.turnstileToken,
    );
  } catch {
    return {
      ok: false,
      status: 503,
      message: genericError,
      resetTurnstile: true,
    };
  }
  if (!turnstileValid) {
    return {
      ok: false,
      status: 400,
      errors: {
        turnstileToken: "Please complete the spam check and try again.",
      },
      message: "Spam verification was not accepted.",
      resetTurnstile: true,
    };
  }

  try {
    await dependencies.sendInternal(submission, now);
  } catch {
    return {
      ok: false,
      status: 502,
      message: genericError,
      resetTurnstile: true,
    };
  }

  try {
    await dependencies.sendConfirmation(submission);
  } catch {
    dependencies.logConfirmationFailure?.();
  }

  return { ok: true, submission };
}
