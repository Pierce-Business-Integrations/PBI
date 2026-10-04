import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import SectionHeading from "./SectionHeading";
import styles from "./Services.module.css";

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
    <section className={styles.section}>
      <div className={styles.container}>
        <SectionHeading
          title="What a Custom Foundation Makes Possible"
          copy="A custom build creates room to solve today's needs without locking the business into today's limitations. The initial website can remain focused while preserving a clear path toward deeper integrations, new services, and more capable tools."
        />
        <div className={styles.topics}>
          {capabilities.map(([title, copy]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <p className={styles.note}>
          Custom-built does not mean complexity for its own sake. It means the
          design, structure, and functionality are selected intentionally around
          your business rather than inherited from a generic template.
        </p>
        <div className={styles.actions}>
          <Link
            href="/how-we-work"
            className={styles.primaryButton}
            data-analytics-event="How We Work Navigation Clicked"
            data-analytics-location="web_design_custom_unlocks"
            data-analytics-target="how-we-work"
          >
            How we work
          </Link>
          <Link
            href="/contact"
            className={styles.textLink}
            data-analytics-event="Consultation CTA Clicked"
            data-analytics-location="web_design_custom_unlocks"
            data-analytics-target="contact"
          >
            Discuss your project
          </Link>
        </div>
      </div>
    </section>
  );
}

function WebDesignSection() {
  const steps = [
    [
      "Strategy & structure",
      "Clarify the audience, offer, content priorities, and path each visitor should take.",
    ],
    [
      "Visual direction",
      "Develop a distinct design system that reflects the business rather than a preselected theme.",
    ],
    [
      "Development",
      "Build responsive pages, forms, tracking, and integrations with maintainability in mind.",
    ],
    [
      "Test & launch",
      "Review content, devices, accessibility, performance, analytics, and launch details carefully.",
    ],
  ];
  return (
    <section className={styles.mutedSection}>
      <div className={styles.container}>
        <SectionHeading
          title="A deliberate path from business goals to launch"
          copy="Custom work starts with the information and actions your customers need, not with a theme demo that has to be filled in afterward."
        />
        <ol className={styles.steps} role="list">
          {steps.map(([title, copy]) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
        <div className={styles.twoColumns}>
          <article>
            <h3>Custom development</h3>
            <p>
              Page structure, visual decisions, interactions, and integrations
              are shaped around the business. This provides greater flexibility
              and a more distinctive result, with scope and ongoing needs
              defined up front.
            </p>
          </article>
          <article>
            <h3>Managed template platforms</h3>
            <p>
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
    <section className={styles.section}>
      <div className={styles.container}>
        <SectionHeading
          title="Clear boundaries make ongoing support work better"
          copy="Each care plan includes a defined amount of update time. A request is considered minor when it can be completed safely within that allowance and does not change the site’s underlying structure or functionality."
        />
        <div className={styles.supportGroups}>
          {groups.map((group) => (
            <article key={group.title}>
              <h3>{group.title}</h3>
              <ul className={styles.checklist} role="list">
                {group.items.map((item) => (
                  <li key={item}>
                    <Check size={16} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className={styles.note}>
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
      "Diagnose",
      "Map the workflow, users, exceptions, current tools, and cost of the problem.",
    ],
    [
      "Architect",
      "Compare approaches and define requirements, ownership, support, timeline, and investment in a written proposal.",
    ],
    [
      "Implement",
      "Build or configure the agreed solution, test it with real scenarios, and prepare the team to use it.",
    ],
    [
      "Improve",
      "Review agreed indicators, gather feedback, and plan changes that produce practical value.",
    ],
  ];
  return (
    <>
      <section className={styles.section}>
        <div className={styles.container}>
          <SectionHeading
            title="The recommendation fits the constraint"
            copy="The right choice depends on the workflow, existing software, team, and cost of ownership."
          />
          <figure className={styles.workflow}>
            <div className={styles.workflowPath}>
              <div>
                <p className={styles.workflowLabel}>A request comes in</p>
                <p>From a form, email, or existing tool</p>
              </div>
              <ArrowRight className={styles.workflowArrow} aria-hidden="true" />
              <div>
                <p className={styles.workflowLabel}>
                  Information stays connected
                </p>
                <p>The details move through your systems</p>
              </div>
              <ArrowRight className={styles.workflowArrow} aria-hidden="true" />
              <div>
                <p className={styles.workflowLabel}>
                  Your team knows what comes next
                </p>
                <p>A clear handoff with the context to act</p>
              </div>
            </div>
            <figcaption>
              An example of a connected workflow. The actual design follows how
              your business works.
            </figcaption>
          </figure>
          <div className={styles.topics}>
            {approaches.map((approach) => (
              <article key={approach.title}>
                <h3>{approach.title}</h3>
                <p>{approach.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className={styles.mutedSection}>
        <div className={styles.container}>
          <SectionHeading
            title="A defined path from diagnosis to improvement"
            copy="Substantial systems work is scoped around the business problem and technical requirements. Smaller improvements can be proposed separately when a custom build is unnecessary."
          />
          <ol className={styles.steps} role="list">
            {stages.map(([title, copy]) => (
              <li key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
          <p className={styles.note}>
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
      "Advertisement",
      "Reach people whose location, intent, or interests align with a clear offer.",
    ],
    [
      "Landing page",
      "Continue the message, answer the essential questions, and make the next action obvious.",
    ],
    [
      "Qualified action",
      "Track a useful form submission, call, appointment request, or completed booking.",
    ],
    [
      "Business follow-up",
      "Respond promptly, record lead quality, and use the outcome to improve the campaign.",
    ],
  ];
  return (
    <section className={styles.mutedSection}>
      <div className={styles.container}>
        <SectionHeading
          title="The advertisement is only the beginning"
          copy="Campaign performance depends on the full path. The ad, landing experience, tracking, qualification, and follow-up process need to support the same business goal."
        />
        <ol className={styles.steps} role="list">
          {path.map(([title, copy]) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
        <p className={styles.note}>
          Reporting should connect campaign activity to qualified leads or
          completed bookings, not stop at impressions and clicks. Results still
          depend on the offer, market, budget, competition, and follow-up.
        </p>
        <div className={styles.twoColumns}>
          <article>
            <h3>Campaign setup</h3>
            <p>
              A campaign can begin with a new website or an existing one. Setup,
              conversion tracking, landing-page alignment, and any ongoing
              management are defined in the written scope.
            </p>
            <Link
              href="/how-we-work"
              data-analytics-event="How We Work Navigation Clicked"
              data-analytics-location="advertising_service"
              data-analytics-target="how-we-work"
              className={styles.textLink}
            >
              See how projects begin <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </article>
          <article>
            <h3>Advertising management</h3>
            <p>
              Management scope depends on account size, platforms, locations,
              and optimization needs. The focus remains qualified leads and
              useful reporting on business outcomes.
            </p>
            <Link
              href="/how-we-work"
              data-analytics-event="How We Work Navigation Clicked"
              data-analytics-location="advertising_service"
              data-analytics-target="how-we-work"
              className={styles.textLink}
            >
              How we plan ongoing support{" "}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </article>
        </div>
        <div className={styles.detailsNote}>
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
