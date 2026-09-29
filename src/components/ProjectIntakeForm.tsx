"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Send } from "lucide-react";
import clsx from "clsx";
import {
  intakeBudgetOptions,
  intakeInterests,
  intakeTimelineOptions,
  teamSizeOptions,
} from "@/lib/intake-options";
import { site } from "@/lib/site";
import TurnstileWidget from "./TurnstileWidget";

type Errors = Record<string, string>;
type ApiResponse = {
  ok: boolean;
  message?: string;
  errors?: Errors;
  resetTurnstile?: boolean;
};

const textKeys = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "business",
  "role",
  "website",
  "industry",
  "teamSize",
  "serviceArea",
  "businessOverview",
  "projectSummary",
  "currentSituation",
  "painPoints",
  "businessImpact",
  "desiredOutcome",
  "successMeasures",
  "existingTools",
  "usersAndRoles",
  "dataAndIntegrations",
  "constraints",
  "websiteGoals",
  "websiteAudience",
  "websiteContent",
  "websiteFeatures",
  "websiteCareNeeds",
  "currentHosting",
  "adChannels",
  "targetMarket",
  "monthlyAdSpend",
  "qualifiedLead",
  "adTracking",
  "workflowDetails",
  "workflowVolume",
  "exceptionsAndApprovals",
  "aiConsiderations",
  "budget",
  "timeline",
  "decisionMakers",
  "supportingMaterials",
  "additionalContext",
] as const;

const requiredFields = [
  ["firstName", "Enter your first name."],
  ["lastName", "Enter your last name."],
  ["email", "Enter a valid email address."],
  ["business", "Enter your business name."],
  ["projectSummary", "Describe the project in at least 20 characters."],
  ["currentSituation", "Describe the current situation."],
  ["painPoints", "Describe the problem or pain points."],
  ["desiredOutcome", "Describe the desired outcome."],
  ["budget", "Choose a budget range."],
  ["timeline", "Choose a timeline."],
] as const;

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function validate(form: FormData, interests: readonly string[], token: string) {
  const errors: Errors = {};
  requiredFields.forEach(([key, message]) => {
    if (!value(form, key)) errors[key] = message;
  });
  if (
    value(form, "projectSummary").length > 0 &&
    value(form, "projectSummary").length < 20
  )
    errors.projectSummary = "Describe the project in at least 20 characters.";
  for (const key of ["currentSituation", "painPoints", "desiredOutcome"])
    if (value(form, key).length > 0 && value(form, key).length < 10)
      errors[key] = "Please provide at least 10 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value(form, "email")))
    errors.email = "Enter a valid email address.";
  if (value(form, "website")) {
    try {
      new URL(value(form, "website"));
    } catch {
      errors.website = "Enter a complete URL beginning with https://";
    }
  }
  if (!interests.length)
    errors.interests = "Select at least one area of interest.";
  if (!form.get("consent")) errors.consent = "Consent is required.";
  if (!token) errors.turnstileToken = "Please complete the spam check.";
  return errors;
}

const inputClass =
  "w-full rounded-sm border border-charcoal/20 bg-ivory px-4 py-3 text-base text-charcoal placeholder:text-taupe focus:border-foothill focus:outline-none focus:ring-2 focus:ring-foothill/25 aria-[invalid=true]:border-red-700";

function Field({
  name,
  label,
  errors,
  required = false,
  type = "text",
  placeholder,
  maxLength = 1000,
  rows = 0,
  helper,
  options,
}: {
  name: string;
  label: string;
  errors: Errors;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  helper?: string;
  options?: readonly string[];
}) {
  const error = errors[name];
  const shared = {
    id: name,
    name,
    "aria-invalid": Boolean(error),
    "aria-describedby": error
      ? `${name}-error`
      : helper
        ? `${name}-help`
        : undefined,
    className: inputClass,
  };
  return (
    <div className={clsx("grid gap-2", error && "has-error")}>
      <label
        htmlFor={name}
        className="text-xs font-semibold uppercase tracking-[0.14em] text-charcoal-soft"
      >
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {options ? (
        <select {...shared} defaultValue="">
          <option value="">Select one</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : rows ? (
        <textarea
          {...shared}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
        />
      ) : (
        <input
          {...shared}
          type={type}
          maxLength={maxLength}
          placeholder={placeholder}
        />
      )}
      {helper && (
        <p id={`${name}-help`} className="text-sm text-taupe">
          {helper}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

function Section({
  number,
  title,
  intro,
  children,
}: {
  number: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="border-t border-charcoal/20 py-9 sm:py-12"
      aria-labelledby={`intake-section-${number}`}
    >
      <p className="eyebrow text-foothill">{number} / Project Discovery</p>
      <h2
        id={`intake-section-${number}`}
        className="heading-serif mt-3 text-2xl sm:text-3xl"
      >
        {title}
      </h2>
      {intro && (
        <p className="mt-3 max-w-3xl leading-7 text-charcoal-soft">{intro}</p>
      )}
      <div className="mt-7 grid gap-6">{children}</div>
    </section>
  );
}

const genericError = `We couldn’t send the project intake right now. Please try again or email ${site.email}.`;

export default function ProjectIntakeForm() {
  const router = useRouter();
  const startedAt = useRef(0);
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const showWeb = interests.some((item) => item.includes("Website"));
  const showAds = interests.some((item) => item.includes("Advertising"));
  const showSystems = interests.some((item) =>
    /system|automation|process|Not sure/i.test(item),
  );

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  function toggleInterest(interest: string) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
    setErrors((current) => ({ ...current, interests: "" }));
  }

  function focusError(form: HTMLFormElement) {
    requestAnimationFrame(
      () =>
        form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus() ||
        statusRef.current?.focus(),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || isSent) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const nextErrors = validate(data, interests, turnstileToken);
    setErrors(nextErrors);
    setNotice("");
    if (Object.keys(nextErrors).length) {
      focusError(form);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    submitting.current = true;
    setIsSending(true);
    setNotice("Sending your project intake…");
    try {
      const answers = Object.fromEntries(
        textKeys.map((key) => [key, value(data, key)]),
      );
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          ...answers,
          interests,
          consent: data.get("consent") === "yes",
          honeypot: value(data, "companyWebsite"),
          turnstileToken,
          formStartedAt: startedAt.current || Date.now(),
        }),
      });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok || !result.ok) {
        setErrors(result.errors || {});
        setNotice(result.message || genericError);
        if (result.resetTurnstile) {
          setTurnstileToken("");
          setTurnstileReset((key) => key + 1);
        }
        focusError(form);
        return;
      }
      setIsSent(true);
      setNotice("Project intake sent. Redirecting…");
      router.replace("/project-intake/received");
    } catch {
      setNotice(genericError);
      setTurnstileToken("");
      setTurnstileReset((key) => key + 1);
      requestAnimationFrame(() => statusRef.current?.focus());
    } finally {
      window.clearTimeout(timeout);
      submitting.current = false;
      setIsSending(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isSending || isSent}
      aria-describedby="intake-status"
      className="max-w-5xl"
    >
      <div
        className="absolute -left-[10000px] h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <label>
          Leave this field empty
          <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="border-l border-brass/60 pl-5">
        <p className="eyebrow">A complete starting picture</p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-charcoal-soft">
          Core questions are required. Service-specific questions are optional
          but help shape a practical proposal. Nothing here commits you to a
          particular solution.
        </p>
      </div>

      <Section number="01" title="Your business and point of contact">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            name="firstName"
            label="First name"
            errors={errors}
            required
            maxLength={100}
          />
          <Field
            name="lastName"
            label="Last name"
            errors={errors}
            required
            maxLength={100}
          />
          <Field
            name="email"
            label="Email"
            errors={errors}
            required
            type="email"
            maxLength={254}
          />
          <Field
            name="phone"
            label="Phone"
            errors={errors}
            type="tel"
            maxLength={40}
          />
          <Field
            name="business"
            label="Business name"
            errors={errors}
            required
            maxLength={200}
          />
          <Field
            name="role"
            label="Your role"
            errors={errors}
            maxLength={120}
          />
          <Field
            name="website"
            label="Current website URL"
            errors={errors}
            type="url"
            placeholder="https://"
            maxLength={500}
          />
          <Field
            name="industry"
            label="Industry or business type"
            errors={errors}
            maxLength={150}
          />
          <Field
            name="teamSize"
            label="Team size"
            errors={errors}
            options={teamSizeOptions}
          />
          <Field
            name="serviceArea"
            label="Locations or service area"
            errors={errors}
            maxLength={200}
          />
        </div>
      </Section>

      <Section
        number="02"
        title="The problem and the outcome"
        intro="Start with what is happening in the business. The right solution can be a process change, existing platform, custom application, website, campaign, or a combination."
      >
        <fieldset
          className="grid gap-3"
          aria-invalid={Boolean(errors.interests)}
          aria-describedby={
            errors.interests ? "interests-error" : "interests-help"
          }
        >
          <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-charcoal-soft">
            Areas you want to explore <span aria-hidden="true">*</span>
          </legend>
          <p id="interests-help" className="text-sm text-taupe">
            Choose all that apply.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {intakeInterests.map((interest) => (
              <label
                key={interest}
                className="flex min-h-12 cursor-pointer items-start gap-3 border border-charcoal/15 bg-ivory p-4 text-sm text-charcoal-soft focus-within:ring-2 focus-within:ring-foothill/30"
              >
                <input
                  type="checkbox"
                  checked={interests.includes(interest)}
                  onChange={() => toggleInterest(interest)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-foothill"
                />
                <span>{interest}</span>
              </label>
            ))}
          </div>
          {errors.interests && (
            <p id="interests-error" className="text-sm text-red-800">
              {errors.interests}
            </p>
          )}
        </fieldset>
        <Field
          name="businessOverview"
          label="What does the business do?"
          errors={errors}
          rows={3}
          maxLength={1500}
          placeholder="Who do you serve, and how does the work usually happen?"
        />
        <Field
          name="projectSummary"
          label="What project are you considering?"
          errors={errors}
          required
          rows={5}
          maxLength={5000}
          placeholder="Describe the need in your own words, even if the scope is uncertain."
        />
        <Field
          name="currentSituation"
          label="What is happening today?"
          errors={errors}
          required
          rows={4}
          maxLength={3000}
          placeholder="How is the work handled now? What tools, steps, or handoffs are involved?"
        />
        <Field
          name="painPoints"
          label="Where is time, money, or follow-through being lost?"
          errors={errors}
          required
          rows={4}
          maxLength={3000}
          placeholder="Which bottlenecks, repeated tasks, errors, missed leads, or customer issues matter most?"
        />
        <Field
          name="businessImpact"
          label="What is the impact today?"
          errors={errors}
          rows={3}
          maxLength={2000}
          placeholder="A rough volume, time cost, missed opportunity, or customer impact is helpful; estimates are fine."
        />
        <Field
          name="desiredOutcome"
          label="What should be better after this project?"
          errors={errors}
          required
          rows={4}
          maxLength={3000}
          placeholder="Describe the result rather than a required technology."
        />
        <Field
          name="successMeasures"
          label="How would you know it worked?"
          errors={errors}
          rows={3}
          maxLength={2000}
          placeholder="Examples: hours saved, fewer errors, faster delivery, qualified leads, bookings, uptime."
        />
      </Section>

      <Section
        number="03"
        title="People, tools, and constraints"
        intro="These questions apply to every project. If something is not yet known, leave it blank or say so."
      >
        <Field
          name="existingTools"
          label="Existing platforms and tools"
          errors={errors}
          rows={3}
          maxLength={2000}
          placeholder="CRM, booking system, spreadsheets, website platform, accounting, email, ad accounts, or other systems."
        />
        <Field
          name="usersAndRoles"
          label="Who will use or manage the result?"
          errors={errors}
          rows={3}
          maxLength={1500}
          placeholder="Internal roles, customers, partners, administrators, and approximate user counts."
        />
        <Field
          name="dataAndIntegrations"
          label="Data, reporting, and connections"
          errors={errors}
          rows={3}
          maxLength={2000}
          placeholder="What information must move between systems? What reports or integrations are needed?"
        />
        <Field
          name="constraints"
          label="Constraints or requirements"
          errors={errors}
          rows={3}
          maxLength={2000}
          placeholder="Existing contracts, brand rules, accessibility, privacy, approvals, platform preferences, or things that cannot change."
        />
      </Section>

      {showSystems && (
        <Section
          number="04"
          title="Systems, integrations, and workflow"
          intro="For operational improvements, custom systems, and automation. Share the real workflow before prescribing a tool."
        >
          <Field
            name="workflowDetails"
            label="Walk through the current workflow"
            errors={errors}
            rows={4}
            maxLength={2000}
            placeholder="What starts the work, who handles each step, and what marks it complete?"
          />
          <Field
            name="workflowVolume"
            label="Volume and frequency"
            errors={errors}
            rows={2}
            maxLength={1000}
            placeholder="How often does this happen and roughly how many records or requests are involved?"
          />
          <Field
            name="exceptionsAndApprovals"
            label="Exceptions, approvals, and manual judgment"
            errors={errors}
            rows={3}
            maxLength={1500}
            placeholder="What cases require a person, a special rule, or an approval?"
          />
          <Field
            name="aiConsiderations"
            label="AI or automation considerations"
            errors={errors}
            rows={3}
            maxLength={1500}
            placeholder="Is AI already in use? Are there tasks where it might help or where it should not be used?"
          />
        </Section>
      )}

      {showWeb && (
        <Section
          number="05"
          title="Website and ongoing care"
          intro="Tell me about the customer experience, content, features, and support needs. Skip anything that does not apply."
        >
          <Field
            name="websiteGoals"
            label="Website goals"
            errors={errors}
            rows={3}
            maxLength={2000}
            placeholder="What should visitors be able to learn or do?"
          />
          <Field
            name="websiteAudience"
            label="Audience and key journeys"
            errors={errors}
            rows={3}
            maxLength={1500}
            placeholder="Who is the site for and what action should they take?"
          />
          <Field
            name="websiteContent"
            label="Content and brand readiness"
            errors={errors}
            rows={3}
            maxLength={1500}
            placeholder="Do you have copy, photos, logo, brand rules, or someone who can review content?"
          />
          <Field
            name="websiteFeatures"
            label="Pages, features, and integrations"
            errors={errors}
            rows={3}
            maxLength={2000}
            placeholder="Booking, forms, payments, member areas, CRM, multilingual content, or other needs."
          />
          <Field
            name="websiteCareNeeds"
            label="Ongoing website support"
            errors={errors}
            rows={3}
            maxLength={1500}
            placeholder="Updates, monitoring, hosting, content changes, analytics, or response expectations."
          />
          <Field
            name="currentHosting"
            label="Current domain, hosting, and site platform"
            errors={errors}
            rows={2}
            maxLength={1000}
            placeholder="Names of providers are enough. Please do not share credentials."
          />
        </Section>
      )}

      {showAds && (
        <Section
          number="06"
          title="Advertising and lead generation"
          intro="Clarify the audience, spend, lead quality, and how results are measured."
        >
          <Field
            name="adChannels"
            label="Current or desired ad channels"
            errors={errors}
            rows={3}
            maxLength={1000}
            placeholder="Google, Meta, or other channels. What has been tried already?"
          />
          <Field
            name="targetMarket"
            label="Target customer and geography"
            errors={errors}
            rows={3}
            maxLength={1500}
            placeholder="Locations, customer types, services, exclusions, and seasonality."
          />
          <Field
            name="monthlyAdSpend"
            label="Approximate monthly advertising spend"
            errors={errors}
            rows={2}
            maxLength={1000}
            helper="Media spend is separate from management fees."
          />
          <Field
            name="qualifiedLead"
            label="What counts as a qualified lead?"
            errors={errors}
            rows={3}
            maxLength={1500}
            placeholder="A phone call, form, booking, sale, or another useful action?"
          />
          <Field
            name="adTracking"
            label="Current conversion tracking and follow-up"
            errors={errors}
            rows={3}
            maxLength={1500}
            placeholder="What is measured today, and who responds when a lead arrives?"
          />
        </Section>
      )}

      <Section
        number="07"
        title="Scope and next steps"
        intro="Planning details help set a realistic first conversation, without turning estimates into a quote."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            name="budget"
            label="Project budget range"
            errors={errors}
            required
            options={intakeBudgetOptions}
          />
          <Field
            name="timeline"
            label="Desired timeline"
            errors={errors}
            required
            options={intakeTimelineOptions}
          />
        </div>
        <Field
          name="decisionMakers"
          label="Who is involved in the decision?"
          errors={errors}
          rows={2}
          maxLength={1500}
          placeholder="Decision maker, project owner, reviewers, or other stakeholders."
        />
        <Field
          name="supportingMaterials"
          label="Relevant material or links"
          errors={errors}
          rows={2}
          maxLength={1500}
          placeholder="Public links to examples or documents are fine. We can arrange secure sharing for private files later."
        />
        <Field
          name="additionalContext"
          label="Anything else I should know?"
          errors={errors}
          rows={4}
          maxLength={3000}
        />
        <div className="grid gap-3">
          <label className="flex items-start gap-3 text-sm leading-6 text-charcoal-soft">
            <input
              type="checkbox"
              name="consent"
              value="yes"
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={
                errors.consent ? "intake-consent-error" : undefined
              }
              className="mt-1 h-4 w-4 shrink-0 accent-foothill"
            />
            <span>
              I consent to Pierce Business Integrations contacting me about this
              project intake. <span aria-hidden="true">*</span>
            </span>
          </label>
          {errors.consent && (
            <p id="intake-consent-error" className="text-sm text-red-800">
              {errors.consent}
            </p>
          )}
        </div>
        <div className="grid gap-3">
          <TurnstileWidget
            siteKey={siteKey}
            resetKey={turnstileReset}
            onToken={setTurnstileToken}
          />
          {errors.turnstileToken && (
            <p className="text-sm text-red-800">{errors.turnstileToken}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <button
            type="submit"
            disabled={isSending || isSent || !turnstileToken || !siteKey}
            className="btn-brass disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? (
              <>
                <LoaderCircle size={17} className="animate-spin" /> Sending…
              </>
            ) : isSent ? (
              "Intake sent"
            ) : (
              <>
                Send project intake <Send size={17} />
              </>
            )}
          </button>
          <p className="text-sm text-taupe">
            Required fields are marked with an asterisk.
          </p>
        </div>
        <p
          ref={statusRef}
          id="intake-status"
          tabIndex={-1}
          role={notice && !isSending ? "alert" : "status"}
          className="border-l-2 border-foothill pl-4 text-sm text-charcoal-soft"
        >
          {notice ||
            "Your intake is verified and emailed directly to Pierce Business Integrations."}
        </p>
      </Section>
    </form>
  );
}
