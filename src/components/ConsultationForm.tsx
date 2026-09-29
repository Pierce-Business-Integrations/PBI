"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Send } from "lucide-react";
import clsx from "clsx";
import { track } from "@vercel/analytics";
import { site } from "@/lib/site";
import { getInitialAttribution } from "@/lib/attribution";
import {
  budgetOptions,
  referralOptions,
  serviceOptions,
  timelineOptions,
} from "@/lib/contact-options";
import { LEAD_MARKER_KEY } from "@/lib/analytics";
import TurnstileWidget from "./TurnstileWidget";
import FormProgress, { formSections } from "./FormProgress";

type Errors = Record<string, string>;
type ApiResponse = {
  ok: boolean;
  message?: string;
  errors?: Errors;
  resetTurnstile?: boolean;
  lead?: {
    serviceInterest?: string;
    estimatedBudget?: string;
    leadSource?: string;
  };
};
const genericError = `We couldn’t send your inquiry right now. Please try again, or email ${site.email} directly.`;

export default function ConsultationForm() {
  const router = useRouter();
  const startedAt = useRef(0);
  const submittingRef = useRef(false);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const sectionRefs = useRef<(HTMLFieldSetElement | null)[]>([]);
  const sectionsContainerRef = useRef<HTMLDivElement>(null);
  const formStartedTrackedRef = useRef(false);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [sectionPositions, setSectionPositions] = useState([0, 0, 0, 0]);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const handleToken = useCallback(
    (token: string) => setTurnstileToken(token),
    [],
  );

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    const ratios = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number((entry.target as HTMLElement).dataset.section);
          ratios.set(index, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        const focused = document.activeElement?.closest("[data-section]");
        if (focused) return;
        const visible = [...ratios.entries()].sort((a, b) => b[1] - a[1])[0];
        if (visible && visible[1] > 0) setActiveSection(visible[0]);
      },
      { rootMargin: "-20% 0px -45% 0px", threshold: [0.1, 0.35, 0.65] },
    );
    sectionRefs.current.forEach(
      (section) => section && observer.observe(section),
    );
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const form = sectionRefs.current[0]?.form;
    if (form) setCompletedSections(sectionCompletion(form, turnstileToken));
  }, [turnstileToken]);

  useEffect(() => {
    const container = sectionsContainerRef.current;
    if (!container) return;
    const updatePositions = () => {
      const containerTop = container.getBoundingClientRect().top;
      setSectionPositions(
        sectionRefs.current.map((section) =>
          section ? section.getBoundingClientRect().top - containerTop : 0,
        ),
      );
    };
    const resizeObserver = new ResizeObserver(updatePositions);
    resizeObserver.observe(container);
    sectionRefs.current.forEach(
      (section) => section && resizeObserver.observe(section),
    );
    updatePositions();
    window.addEventListener("resize", updatePositions);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePositions);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || submittingRef.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const next = validateForm(data, turnstileToken);
    setErrors(next);
    setNotice("");
    if (Object.keys(next).length) {
      requestAnimationFrame(
        () =>
          form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus() ||
          statusRef.current?.focus(),
      );
      return;
    }

    track("Contact Form Attempted", { path: window.location.pathname });

    const attribution = getInitialAttribution();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    submittingRef.current = true;
    setIsSubmitting(true);
    setNotice("Sending your inquiry…");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          firstName: value(data, "firstName"),
          lastName: value(data, "lastName"),
          email: value(data, "email"),
          phone: value(data, "phone"),
          business: value(data, "business"),
          website: value(data, "website"),
          service: value(data, "service"),
          budget: value(data, "budget"),
          timeline: value(data, "timeline"),
          message: value(data, "message"),
          referral: value(data, "referral"),
          consent: data.get("consent") === "yes",
          honeypot: value(data, "companyWebsite"),
          turnstileToken,
          formStartedAt: startedAt.current || Date.now(),
          currentPage: window.location.pathname.slice(0, 1000),
          ...attribution,
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
        requestAnimationFrame(
          () =>
            form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus() ||
            statusRef.current?.focus(),
        );
        return;
      }
      try {
        sessionStorage.setItem(
          LEAD_MARKER_KEY,
          JSON.stringify({ createdAt: Date.now(), ...result.lead }),
        );
      } catch {}
      setCompletedSections([true, true, true, true]);
      setActiveSection(3);
      setIsTransmitting(true);
      setNotice("Inquiry sent. Redirecting…");
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      window.setTimeout(
        () => router.push("/thank-you"),
        reducedMotion ? 0 : 600,
      );
    } catch {
      setNotice(genericError);
      setTurnstileToken("");
      setTurnstileReset((key) => key + 1);
      requestAnimationFrame(() => statusRef.current?.focus());
    } finally {
      window.clearTimeout(timeout);
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  function updateProgress(form: HTMLFormElement) {
    setCompletedSections(sectionCompletion(form, turnstileToken));
  }

  function handleFormInput(form: HTMLFormElement) {
    if (!formStartedTrackedRef.current) {
      formStartedTrackedRef.current = true;
      track("Contact Form Started", { path: window.location.pathname });
    }
    updateProgress(form);
  }

  return (
    <form
      onSubmit={handleSubmit}
      onInput={(event) => handleFormInput(event.currentTarget)}
      onChange={(event) => updateProgress(event.currentTarget)}
      noValidate
      className="relative"
      aria-describedby="form-status"
      aria-busy={isSubmitting || isTransmitting}
    >
      <div className="mb-8 border-l border-brass/60 pl-4">
        <p className="eyebrow">/ Start a Project</p>
        <p className="mt-2 max-w-2xl text-sm text-charcoal-soft">
          Tell me where work is getting stuck, or select the service you already
          know you need. Four short sections provide context for a useful first
          conversation.
        </p>
      </div>
      <div
        className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <label>
          Leave this field empty
          <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="md:grid md:grid-cols-[8.5rem_minmax(0,1fr)] md:gap-10 lg:grid-cols-[9.5rem_minmax(0,1fr)] lg:gap-14">
        <FormProgress
          active={activeSection}
          completed={completedSections}
          transmitting={isTransmitting}
          positions={sectionPositions}
        />
        <div
          ref={sectionsContainerRef}
          className={clsx(isTransmitting && "form-transmission-settle")}
        >
          <fieldset
            ref={(node) => {
              sectionRefs.current[0] = node;
            }}
            data-section="0"
            onFocusCapture={() => setActiveSection(0)}
            className="form-section"
          >
            <legend className="sr-only">01 / {formSections[0]}</legend>
            <p className="form-section__heading" aria-hidden="true">
              01 / {formSections[0]}
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                name="firstName"
                label="First name"
                error={errors.firstName}
                required
                maxLength={100}
                annotation="INPUT / NAME"
              />
              <Field
                name="lastName"
                label="Last name"
                error={errors.lastName}
                required
                maxLength={100}
                annotation="INPUT / NAME"
              />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                name="email"
                label="Email"
                type="email"
                error={errors.email}
                required
                maxLength={254}
                annotation="INPUT / EMAIL"
              />
              <Field
                name="phone"
                label="Phone (optional)"
                type="tel"
                error={errors.phone}
                maxLength={40}
                annotation="INPUT / PHONE"
              />
            </div>
          </fieldset>
          <fieldset
            ref={(node) => {
              sectionRefs.current[1] = node;
            }}
            data-section="1"
            onFocusCapture={() => setActiveSection(1)}
            className="form-section"
          >
            <legend className="sr-only">02 / {formSections[1]}</legend>
            <p className="form-section__heading" aria-hidden="true">
              02 / {formSections[1]}
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                name="business"
                label="Business name"
                error={errors.business}
                required
                maxLength={200}
                annotation="INPUT / BUSINESS"
              />
              <Field
                name="website"
                label="Website URL (optional)"
                type="url"
                error={errors.website}
                placeholder="https://"
                maxLength={500}
                annotation="INPUT / URL"
              />
            </div>
          </fieldset>
          <fieldset
            ref={(node) => {
              sectionRefs.current[2] = node;
            }}
            data-section="2"
            onFocusCapture={() => setActiveSection(2)}
            className="form-section"
          >
            <legend className="sr-only">03 / {formSections[2]}</legend>
            <p className="form-section__heading" aria-hidden="true">
              03 / {formSections[2]}
            </p>
            <div className="grid gap-6 xl:grid-cols-3">
              <SelectField
                name="service"
                label="Likely starting point"
                options={serviceOptions}
                error={errors.service}
                annotation="SELECT / SERVICE"
              />
              <SelectField
                name="budget"
                label="Estimated budget"
                options={budgetOptions}
                error={errors.budget}
                annotation="SELECT / BUDGET"
              />
              <SelectField
                name="timeline"
                label="Desired timeline"
                options={timelineOptions}
                error={errors.timeline}
                annotation="SELECT / TIMELINE"
              />
            </div>
          </fieldset>
          <fieldset
            ref={(node) => {
              sectionRefs.current[3] = node;
            }}
            data-section="3"
            onFocusCapture={() => setActiveSection(3)}
            className="form-section"
          >
            <legend className="sr-only">04 / {formSections[3]}</legend>
            <p className="form-section__heading" aria-hidden="true">
              04 / {formSections[3]}
            </p>
            <label
              className={clsx(
                "form-inspection grid gap-2",
                errors.message && "has-error",
              )}
              htmlFor="message"
            >
              <InspectionDecoration annotation="INPUT / MESSAGE" />
              <Label text="Message" required />
              <textarea
                id="message"
                name="message"
                rows={6}
                maxLength={5000}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "message-error" : undefined}
                className={inputClass}
                placeholder="What is getting in the way? How much time, money, or follow-through might it be costing? If you need a website, care, or advertising, tell me what you have in mind."
              />
              {errors.message && (
                <ErrorText id="message-error">{errors.message}</ErrorText>
              )}
            </label>
            <SelectField
              name="referral"
              label="How did you hear about us?"
              options={referralOptions}
              required={false}
              annotation="SELECT / SOURCE"
            />
            <div
              className={clsx("form-inspection", errors.consent && "has-error")}
            >
              <InspectionDecoration annotation="INPUT / CONSENT" />
              <label className="flex items-start gap-3 text-sm text-charcoal-soft">
                <input
                  type="checkbox"
                  name="consent"
                  value="yes"
                  aria-invalid={Boolean(errors.consent)}
                  aria-describedby={
                    errors.consent ? "consent-error" : undefined
                  }
                  className="mt-1 h-4 w-4 accent-foothill"
                />
                <span>
                  I consent to being contacted by Pierce Business Integrations
                  about this inquiry. <span aria-hidden="true">*</span>
                </span>
              </label>
              {errors.consent && (
                <ErrorText id="consent-error">{errors.consent}</ErrorText>
              )}
            </div>
            <div
              className={clsx(
                "form-inspection",
                errors.turnstileToken && "has-error",
              )}
            >
              <InspectionDecoration annotation="VERIFY / SPAM" />
              <TurnstileWidget
                siteKey={siteKey}
                resetKey={turnstileReset}
                onToken={handleToken}
              />
              {errors.turnstileToken && (
                <ErrorText id="turnstile-error">
                  {errors.turnstileToken}
                </ErrorText>
              )}
            </div>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={
                  isSubmitting || isTransmitting || !turnstileToken || !siteKey
                }
                className="btn-brass group disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isTransmitting ? (
                  <>Inquiry Sent</>
                ) : isSubmitting ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send Inquiry{" "}
                    <Send
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
              <p className="text-sm text-taupe">
                Required fields are marked with an asterisk.
              </p>
            </div>
            <p
              ref={statusRef}
              id="form-status"
              role={
                notice && notice !== "Sending your inquiry…" && !isTransmitting
                  ? "alert"
                  : "status"
              }
              tabIndex={-1}
              className="border-l-2 border-foothill pl-4 text-sm text-charcoal-soft"
            >
              {notice ||
                "Your information is securely verified before it is delivered."}
            </p>
          </fieldset>
        </div>
      </div>
    </form>
  );
}

function value(data: FormData, name: string) {
  return String(data.get(name) ?? "").trim();
}
function validateForm(data: FormData, token: string): Errors {
  const errors: Errors = {};
  const required = [
    ["firstName", "Enter your first name."],
    ["lastName", "Enter your last name."],
    ["email", "Enter your email address."],
    ["business", "Enter your business name."],
    ["service", "Choose a service interest."],
    ["budget", "Choose an estimated budget."],
    ["timeline", "Choose a desired timeline."],
    ["message", "Tell us at least 10 characters about your project."],
  ] as const;
  required.forEach(([name, message]) => {
    if (
      !value(data, name) ||
      (name === "message" && value(data, name).length < 10)
    )
      errors[name] = message;
  });
  const email = value(data, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email address.";
  const website = value(data, "website");
  if (website) {
    try {
      new URL(website);
    } catch {
      errors.website = "Enter a complete URL beginning with https://";
    }
  }
  if (!data.get("consent"))
    errors.consent = "Consent is required before submitting.";
  if (!token) errors.turnstileToken = "Please complete the spam check.";
  return errors;
}

function sectionCompletion(form: HTMLFormElement, token: string): boolean[] {
  const data = new FormData(form);
  const email = value(data, "email");
  const website = value(data, "website");
  let websiteValid = true;
  if (website) {
    try {
      new URL(website);
    } catch {
      websiteValid = false;
    }
  }
  return [
    Boolean(
      value(data, "firstName") &&
      value(data, "lastName") &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    ),
    Boolean(value(data, "business") && websiteValid),
    Boolean(
      value(data, "service") &&
      value(data, "budget") &&
      value(data, "timeline"),
    ),
    Boolean(
      value(data, "message").length >= 10 && data.get("consent") && token,
    ),
  ];
}

const inputClass =
  "w-full border border-charcoal/20 bg-ivory px-4 py-3 text-base text-charcoal placeholder:text-taupe focus:border-foothill focus:outline-none aria-[invalid=true]:border-red-700";
function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-charcoal-soft">
      {text}
      {required && <span aria-hidden="true"> *</span>}
    </span>
  );
}
function ErrorText({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <span id={id} className="text-sm text-red-800">
      {children}
    </span>
  );
}
function Field({
  name,
  label,
  type = "text",
  error,
  required,
  placeholder,
  maxLength,
  annotation,
}: {
  name: string;
  label: string;
  type?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  annotation: string;
}) {
  return (
    <label
      className={clsx("form-inspection grid gap-2", error && "has-error")}
      htmlFor={name}
    >
      <InspectionDecoration annotation={annotation} />
      <Label text={label} required={required} />
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={inputClass}
      />
      {error && <ErrorText id={`${name}-error`}>{error}</ErrorText>}
    </label>
  );
}
function SelectField({
  name,
  label,
  options,
  error,
  required = true,
  annotation,
}: {
  name: string;
  label: string;
  options: readonly string[];
  error?: string;
  required?: boolean;
  annotation: string;
}) {
  return (
    <label
      className={clsx("form-inspection grid gap-2", error && "has-error")}
      htmlFor={name}
    >
      <InspectionDecoration annotation={annotation} />
      <Label text={label} required={required} />
      <select
        id={name}
        name={name}
        defaultValue=""
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={inputClass}
      >
        <option value="" disabled>
          Select one{required ? "" : " (optional)"}
        </option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      {error && <ErrorText id={`${name}-error`}>{error}</ErrorText>}
    </label>
  );
}

function InspectionDecoration({ annotation }: { annotation: string }) {
  return (
    <>
      <span className="form-inspection__annotation" aria-hidden="true">
        {annotation}
      </span>
      <span className="form-inspection__guide" aria-hidden="true" />
    </>
  );
}
