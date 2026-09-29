import {
  fieldErrors,
  intakeSchema,
  type IntakeSubmission,
} from "./intake-schema";

export type IntakeDependencies = {
  now: () => Date;
  verifyTurnstile: (token: string) => Promise<boolean>;
  sendInternal: (
    submission: IntakeSubmission,
    submittedAt: Date,
  ) => Promise<void>;
  sendConfirmation: (submission: IntakeSubmission) => Promise<void>;
  logConfirmationFailure?: () => void;
};

export type IntakeResult =
  | { ok: true; submission: IntakeSubmission }
  | {
      ok: false;
      status: number;
      errors?: Record<string, string>;
      message: string;
      resetTurnstile?: boolean;
    };

const genericError =
  "We couldn’t send the project intake right now. Please try again or contact Pierce Business Integrations directly.";

export async function processIntakeSubmission(
  input: unknown,
  dependencies: IntakeDependencies,
): Promise<IntakeResult> {
  const parsed = intakeSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      status: 400,
      errors: fieldErrors(parsed.error),
      message: "Please review the highlighted fields.",
    };

  const submission = parsed.data;
  const now = dependencies.now();
  const elapsed = now.getTime() - submission.formStartedAt;
  if (submission.honeypot || elapsed < 4000 || elapsed > 24 * 60 * 60 * 1000)
    return {
      ok: false,
      status: 400,
      message: genericError,
      resetTurnstile: true,
    };

  try {
    if (!(await dependencies.verifyTurnstile(submission.turnstileToken)))
      return {
        ok: false,
        status: 400,
        errors: {
          turnstileToken: "Please complete the spam check and try again.",
        },
        message: "Spam verification was not accepted.",
        resetTurnstile: true,
      };
  } catch {
    return {
      ok: false,
      status: 503,
      message: genericError,
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
