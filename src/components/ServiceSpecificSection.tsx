import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import SectionHeading from "./SectionHeading";

export default function ServiceSpecificSection({ slug }: { slug: string }) {
  if (slug === "web-design")
    return (
      <>
        <WebDesignSection />
        <WhatCustomUnlocksSection />
      </>
    );
  if (slug === "website-care") return <WebsiteCareSection />;
  if (slug === "automation") return <AutomationSection />;
  if (slug === "advertising") return <AdvertisingSection />;
  return null;
}

function WhatCustomUnlocksSection() {
  const capabilities = [
    [
      "A design unique to the business",
      "The layout, visual system, and interactions are shaped around the company rather than adapted from a generic theme demonstration.",
    ],
    [
      "A better customer journey",
      "Pages, forms, calls to action, and booking paths can be organized around how customers actually discover, evaluate, and choose the business.",
    ],
    [
      "Deeper business integrations",
      "The website can connect to booking systems, CRMs, analytics, email platforms, payments, and internal workflows.",
    ],
    [
      "Room to add new capabilities",
      "New services, locations, landing pages, portals, dashboards, and custom tools can be added without replacing the entire platform.",
    ],
    [
      "More control over performance and tracking",
      "The technical implementation can be optimized and measured more directly than many closed website-builder environments allow.",
    ],
    [
      "A platform that can evolve",
      "The first project can remain practical and appropriately scoped while providing a foundation for future improvements.",
    ],
  ];
  return (
    <section className="section-pad bg-ivory">
      <div className="container-x">
        <SectionHeading
          eyebrow="/ What Custom Unlocks"
          title="What a Custom Foundation Makes Possible"
          copy="A custom build creates room to solve today's needs without locking the business into today's limitations. The initial website can remain focused while preserving a clear path toward deeper integrations, new services, and more capable tools."
        />
        <div className="mt-12 grid border-y border-charcoal/15 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(([title, copy], index) => (
            <article
              key={title}
              className={`border-b border-charcoal/15 py-8 last:border-b-0 md:p-8 ${index % 2 === 0 ? "md:border-r" : ""} ${index >= 4 ? "md:border-b-0" : ""} lg:border-b-0 ${index >= 3 ? "lg:border-t" : ""} ${index % 3 !== 2 ? "lg:border-r" : "lg:border-r-0"}`}
            >
              <span className="font-serif italic text-brass-deep">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-serif text-2xl text-charcoal">
                {title}
              </h3>
              <p className="mt-3 text-sm text-charcoal-soft">{copy}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-4xl border-l-2 border-foothill pl-5 text-charcoal-soft">
          Custom-built does not mean complexity for its own sake. It means the
          design, structure, and functionality are selected intentionally around
          your business rather than inherited from a generic template.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/pricing#build"
            className="btn-brass"
            data-analytics-event="Pricing Navigation Clicked"
            data-analytics-location="web_design_custom_unlocks"
            data-analytics-target="build"
          >
            View Website Pricing
          </Link>
          <Link
            href="/contact"
            className="btn-outline"
            data-analytics-event="Consultation CTA Clicked"
            data-analytics-location="web_design_custom_unlocks"
            data-analytics-target="contact"
          >
            Start a Conversation
          </Link>
        </div>
      </div>
    </section>
  );
}

function WebDesignSection() {
  const steps = [
    [
      "01",
      "Strategy & structure",
      "Clarify the audience, offer, content priorities, and path each visitor should take.",
    ],
    [
      "02",
      "Visual direction",
      "Develop a distinct design system that reflects the business rather than a preselected theme.",
    ],
    [
      "03",
      "Development",
      "Build responsive pages, forms, tracking, and integrations with maintainability in mind.",
    ],
    [
      "04",
      "Test & launch",
      "Review content, devices, accessibility, performance, analytics, and launch details carefully.",
    ],
  ];
  return (
    <section className="section-pad bg-charcoal text-ivory">
      <div className="container-x">
        <SectionHeading
          eyebrow="How Websites Are Built"
          title="A deliberate path from business goals to launch"
          light
          copy="Custom work starts with the information and actions your customers need, not with a theme demo that has to be filled in afterward."
        />
        <ol className="mt-12 grid border-y border-ivory/15 md:grid-cols-4">
          {steps.map(([number, title, copy]) => (
            <li
              key={number}
              className="border-b border-ivory/15 py-7 md:border-b-0 md:border-r md:px-6 md:last:border-r-0"
            >
              <span className="font-serif italic text-foothill-light">
                {number}
              </span>
              <h3 className="mt-3 font-serif text-xl text-ivory">{title}</h3>
              <p className="mt-3 text-sm text-ivory/65">{copy}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 grid gap-8 md:grid-cols-2">
          <article className="border-l-2 border-foothill-light pl-6">
            <h3 className="font-serif text-2xl">Custom development</h3>
            <p className="mt-3 text-ivory/65">
              Page structure, visual decisions, interactions, and integrations
              are shaped around the business. This provides greater flexibility
              and a more distinctive result, with scope and ongoing needs
              defined up front.
            </p>
          </article>
          <article className="border-l border-ivory/20 pl-6">
            <h3 className="font-serif text-2xl">Managed template platforms</h3>
            <p className="mt-3 text-ivory/65">
              These can be appropriate for very simple needs or constrained
              budgets, but design and functionality stay within the platform’s
              system. Recurring fees, app dependencies, and migration limits
              should be considered.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function WebsiteCareSection() {
  const groups = [
    {
      title: "Included oversight",
      items: [
        "Uptime and platform monitoring",
        "Routine platform review",
        "Form-delivery checks",
        "Plan-specific analytics and performance review",
      ],
    },
    {
      title: "Minor updates",
      items: [
        "Replacing supplied text or images",
        "Updating hours, staff details, or service information",
        "Small styling corrections",
        "Simple form-field or link changes",
      ],
    },
    {
      title: "Separately scoped work",
      items: [
        "New pages or major page sections",
        "Redesigns and new functionality",
        "Custom integrations or automation",
        "Large content migrations or urgent recovery work",
      ],
    },
  ];
  return (
    <section className="section-pad bg-ivory">
      <div className="container-x">
        <SectionHeading
          eyebrow="What Care Covers"
          title="Clear boundaries make ongoing support work better"
          copy="Each care plan includes a defined amount of update time. A request is considered minor when it can be completed safely within that allowance and does not change the site’s underlying structure or functionality."
        />
        <div className="mt-12 grid border-y border-charcoal/15 lg:grid-cols-3">
          {groups.map((group, index) => (
            <article
              key={group.title}
              className={`py-8 lg:px-8 ${index < 2 ? "border-b border-charcoal/15 lg:border-b-0 lg:border-r" : ""}`}
            >
              <h3 className="font-serif text-2xl text-charcoal">
                {group.title}
              </h3>
              <ul className="mt-5 grid gap-3">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-sm text-charcoal-soft"
                  >
                    <Check size={16} className="mt-1 shrink-0 text-foothill" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-7 text-sm italic text-taupe">
          If a request falls outside the plan, you will receive a separate scope
          or recommendation before additional work begins.
        </p>
      </div>
    </section>
  );
}

function AutomationSection() {
  const approaches = [
    {
      title: "Improve the process",
      copy: "Clarify ownership, handoffs, and decisions when a change in the way work is done will solve the constraint.",
    },
    {
      title: "Use or connect existing tools",
      copy: "Configure an appropriate platform or integrate the systems already in use when that meets the need reliably.",
    },
    {
      title: "Build a custom application",
      copy: "Create a portal, internal tool, dashboard, or workflow application when standard products cannot support the business well.",
    },
  ];
  const stages = [
    [
      "01",
      "Diagnose",
      "Map the workflow, users, exceptions, current tools, and cost of the problem.",
    ],
    [
      "02",
      "Architect",
      "Compare approaches and define requirements, ownership, support, timeline, and investment in a written proposal.",
    ],
    [
      "03",
      "Implement",
      "Build or configure the agreed solution, test it with real scenarios, and prepare the team to use it.",
    ],
    [
      "04",
      "Improve",
      "Review agreed indicators, gather feedback, and plan changes that produce practical value.",
    ],
  ];
  return (
    <>
      <section className="section-pad bg-ivory">
        <div className="container-x">
          <SectionHeading
            eyebrow="Choosing the Approach"
            title="The recommendation fits the constraint"
            copy="The right choice depends on the workflow, existing software, team, and cost of ownership."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {approaches.map((approach) => (
              <article
                key={approach.title}
                className="border border-charcoal/15 bg-ivory-deep p-7"
              >
                <h3 className="font-serif text-2xl text-charcoal">
                  {approach.title}
                </h3>
                <p className="mt-5 text-sm text-charcoal-soft">
                  {approach.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section-pad bg-charcoal text-ivory">
        <div className="container-x">
          <SectionHeading
            eyebrow="How a Systems Engagement Works"
            title="A defined path from diagnosis to improvement"
            copy="Substantial systems work is scoped around the business problem and technical requirements. Smaller improvements can be proposed separately when a custom build is unnecessary."
            light
          />
          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stages.map(([number, title, copy]) => (
              <li key={number} className="border-t border-ivory/20 pt-6">
                <span className="font-serif text-xl italic text-brass-light">
                  {number}
                </span>
                <h3 className="mt-3 font-serif text-2xl">{title}</h3>
                <p className="mt-3 text-sm text-ivory/65">{copy}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 max-w-3xl border-l-2 border-brass pl-5 text-ivory/70">
            Measures might include time spent on a task, handoff delays, error
            rates, or visibility into work. Baselines and targets are agreed
            with the client when the necessary data exists; outcomes are not
            guaranteed.
          </p>
        </div>
      </section>
    </>
  );
}

function AdvertisingSection() {
  const path = [
    [
      "01",
      "Advertisement",
      "Reach people whose location, intent, or interests align with a clear offer.",
    ],
    [
      "02",
      "Landing page",
      "Continue the message, answer the essential questions, and make the next action obvious.",
    ],
    [
      "03",
      "Qualified action",
      "Track a useful form submission, call, appointment request, or completed booking.",
    ],
    [
      "04",
      "Business follow-up",
      "Respond promptly, record lead quality, and use the outcome to improve the campaign.",
    ],
  ];
  return (
    <section className="section-pad bg-charcoal text-ivory">
      <div className="container-x">
        <SectionHeading
          eyebrow="From Click to Customer Conversation"
          title="The advertisement is only the beginning"
          light
          copy="Campaign performance depends on the full path. The ad, landing experience, tracking, qualification, and follow-up process need to support the same business goal."
        />
        <ol className="mt-12 grid gap-0 lg:grid-cols-4">
          {path.map(([number, title, copy], index) => (
            <li
              key={number}
              className="relative border-t border-ivory/20 py-7 lg:border-l lg:border-t-0 lg:px-7"
            >
              {index < path.length - 1 && (
                <ArrowRight
                  className="absolute -right-3 top-7 z-10 hidden text-foothill-light lg:block"
                  size={20}
                  aria-hidden="true"
                />
              )}
              <span className="font-serif italic text-foothill-light">
                {number}
              </span>
              <h3 className="mt-3 font-serif text-2xl">{title}</h3>
              <p className="mt-3 text-sm text-ivory/65">{copy}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-3xl border-l-2 border-foothill-light pl-5 text-ivory/70">
          Reporting should connect campaign activity to qualified leads or
          completed bookings, not stop at impressions and clicks. Results still
          depend on the offer, market, budget, competition, and follow-up.
        </p>
        <div className="mt-14 grid gap-8 border-y border-ivory/15 py-9 lg:grid-cols-2">
          <article>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foothill-light">
              Start at launch
            </p>
            <h3 className="mt-3 font-serif text-2xl">Campaign setup</h3>
            <p className="mt-3 text-sm text-ivory/65">
              A campaign can begin with a new website or an existing one. Setup,
              conversion tracking, landing-page alignment, and any ongoing
              management are defined in the written scope.
            </p>
            <Link
              href="/pricing#grow"
              data-analytics-event="Pricing Navigation Clicked"
              data-analytics-location="advertising_service"
              data-analytics-target="grow"
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ivory underline decoration-foothill-light underline-offset-4"
            >
              View advertising pricing{" "}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </article>
          <article>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foothill-light">
              Continue as needed
            </p>
            <h3 className="mt-3 font-serif text-2xl">Advertising management</h3>
            <p className="mt-3 text-sm text-ivory/65">
              Management scope depends on account size, platforms, locations,
              and optimization needs. The focus remains qualified leads and
              useful reporting on business outcomes.
            </p>
            <Link
              href="/pricing#grow"
              data-analytics-event="Pricing Navigation Clicked"
              data-analytics-location="advertising_service"
              data-analytics-target="grow"
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ivory underline decoration-foothill-light underline-offset-4"
            >
              View management starting points{" "}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </article>
        </div>
        <div className="mt-8 grid gap-3 text-sm text-ivory/60">
          <p>
            Advertising spend is separate and client accounts remain
            client-owned. Pierce Business Integrations receives only the access
            needed to manage them.
          </p>
          <p>
            Results are not guaranteed. Tracking repairs, landing-page
            development, creative production, and major website changes may
            require a separate initial project or scope.
          </p>
        </div>
      </div>
    </section>
  );
}
