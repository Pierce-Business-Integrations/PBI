import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUpRight, Plus } from "lucide-react";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import PageIllustration from "@/components/PageIllustration";
import { pageMetadata, site } from "@/lib/site";
import siteStyles from "@/components/SiteDesign.module.css";
import styles from "./HowWeWork.module.css";

const description =
  "See how Pierce Business Integrations takes a project from the first conversation through discovery, a scoped proposal, implementation, and ongoing support.";

export const metadata: Metadata = pageMetadata(
  "Our Approach",
  description,
  "/how-we-work",
);

const steps = [
  {
    id: "conversation",
    title: "Start a conversation",
    copy: "Tell us what slows your team down or what you want to improve. Our contact form is enough to begin; you do not need a technical brief.",
  },
  {
    id: "discovery",
    title: "Understand the work",
    copy: "We review your processes, tools, goals, and constraints. Complex work may need a separate discovery and planning engagement before implementation can be scoped.",
  },
  {
    id: "proposal",
    title: "Define the project",
    copy: "You receive a proposal with scope, deliverables, timeline, pricing, and responsibilities. We review the approach together before implementation begins.",
  },
  {
    id: "delivery",
    title: "Build and deliver",
    copy: "We implement the agreed solution, share progress, and make room for your feedback throughout the work.",
  },
  {
    id: "support",
    title: "Support what comes next",
    copy: "We agree on the ongoing support your solution needs. Hosting, monitoring, updates, and further improvements are scoped explicitly.",
  },
] as const;

const faqs = [
  {
    question: "What do I need to start a project?",
    answer:
      "A description of the problem or improvement you have in mind is enough to start. Share the tools you use, who is affected, and any timing or budget constraints you already know. You can use our contact form; a phone call or technical brief is not required.",
  },
  {
    question: "Will we need to replace our existing tools?",
    answer:
      "Not necessarily. We first look at the process and the tools you already use. Better configuration, a workflow change, or an integration may be the right answer. We recommend a replacement or custom application when it fits the requirements and can be supported over time.",
  },
  {
    question: "Can a project be delivered in phases?",
    answer:
      "Where appropriate, we can discuss phased delivery or a smaller initial scope focused on the most pressing need. Dependencies and technical requirements determine what can stand on its own. Each agreed phase has a defined scope, deliverables, timeline, and pricing.",
  },
  {
    question: "What happens after launch?",
    answer:
      "We discuss the support appropriate to your solution and confirm the responsibilities in writing. Website care may include managed hosting, monitoring, updates, and direct support for qualifying websites. Support for custom systems and integrations is scoped around their requirements; additional work is agreed separately.",
  },
] as const;

export default function HowWeWorkPage() {
  return (
    <>
      <PageHero
        title={
          <>
            We start with your business,
            <br />
            then build the right solution.
          </>
        }
        breadcrumbs={[{ label: "Our Approach", href: "/how-we-work" }]}
      >
        <p>
          Custom software, systems integration, practical AI, websites, and
          support. The work starts with understanding what your business needs,
          then agreeing on a clear plan.
        </p>
        <div className={styles.heroActions}>
          <Link
            href="/contact"
            className="btn-brass"
            data-analytics-event="Consultation CTA Clicked"
            data-analytics-location="how_we_work_hero"
            data-analytics-target="contact"
          >
            Discuss your project <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <a href="#process" className={styles.textLink}>
            See the process <ArrowDown size={17} aria-hidden="true" />
          </a>
        </div>
      </PageHero>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                "@id": `${site.url}/how-we-work#webpage`,
                url: `${site.url}/how-we-work`,
                name: "Our Approach | Pierce Business Integrations",
                description,
                about: { "@id": `${site.url}/#organization` },
              },
              {
                "@type": "FAQPage",
                "@id": `${site.url}/how-we-work#questions`,
                mainEntity: faqs.map((faq) => ({
                  "@type": "Question",
                  name: faq.question,
                  acceptedAnswer: { "@type": "Answer", text: faq.answer },
                })),
              },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />

      <section id="process" className={siteStyles.section}>
        <div className={siteStyles.container}>
          <div className={styles.processIntro}>
            <SectionHeading
              title="A clear path through the work."
              copy="Understand the problem. Agree on the project. Keep the next step clear."
            />
            <PageIllustration topic="planning" />
          </div>
          <ol className={styles.process} role="list">
            {steps.map((step) => (
              <li key={step.id} id={step.id} className={styles.step}>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className={`${siteStyles.section} ${siteStyles.sectionAlternate}`}
      >
        <div className={`${siteStyles.container} ${styles.proposalLayout}`}>
          <div className={styles.copy}>
            <SectionHeading title="A proposal you can make a decision on." />
            <p>
              Project pricing depends on scope, complexity, integrations, and
              support requirements. We define those together before presenting a
              scoped proposal.
            </p>
            <p>
              Where appropriate, we can discuss phased delivery or a smaller
              initial scope. The details are agreed in writing before
              implementation begins.
            </p>
            <p>
              Third-party subscriptions, domains, business email, advertising
              spend, and other external costs are identified separately unless
              the written proposal includes them. Changes outside the agreed
              scope are discussed before additional work begins.
            </p>
          </div>
          <figure className={styles.proposalSheet}>
            <figcaption>
              <Image
                src="/logos/pbi-half-lockup.png"
                alt=""
                width={5000}
                height={1742}
                sizes="180px"
                className={styles.sheetLogo}
              />
              <span>What your proposal covers</span>
            </figcaption>
            <dl>
              <div>
                <dt>Scope & deliverables</dt>
                <dd>The agreed work and what you will receive.</dd>
              </div>
              <div>
                <dt>Timeline</dt>
                <dd>Milestones, dependencies, and the delivery plan.</dd>
              </div>
              <div>
                <dt>Pricing & payment terms</dt>
                <dd>Project costs and any separate third-party expenses.</dd>
              </div>
              <div>
                <dt>Responsibilities & support</dt>
                <dd>What each side provides and what happens after launch.</dd>
              </div>
            </dl>
            <p className={styles.sheetFooter}>
              Reviewed together before implementation.
            </p>
          </figure>
        </div>
      </section>

      <section className={siteStyles.section}>
        <div className={`${siteStyles.container} ${styles.communication}`}>
          <SectionHeading title="Keep the next step clear." />
          <div className={styles.copy}>
            <p>
              We confirm how your proposals, agreements, invoices, and project
              updates will be shared when we define the engagement. Client
              portal access is by invitation and is confirmed separately.
            </p>
            <p>
              You do not need a portal account to discuss a project. Start with
              the contact form and we will work through the next steps with you.
            </p>
            <Link
              href="/contact"
              className={styles.textLink}
              data-analytics-event="Consultation CTA Clicked"
              data-analytics-location="how_we_work_documents"
              data-analytics-target="contact"
            >
              Discuss your project <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="questions"
        className={`${siteStyles.section} ${siteStyles.sectionAlternate}`}
      >
        <div className={`${siteStyles.container} ${styles.faqLayout}`}>
          <SectionHeading title="A few useful answers." />
          <div className={styles.faqs}>
            {faqs.map((faq) => (
              <details key={faq.question} className={styles.faq}>
                <summary>
                  <span>{faq.question}</span>
                  <Plus size={20} aria-hidden="true" />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Tell us what you want to improve."
        copy="Start through our contact form. You do not need a finished scope or a particular technology in mind."
        buttonLabel="Discuss your project"
      />
      <Footer />
    </>
  );
}
