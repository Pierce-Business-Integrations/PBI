import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import InspectionFrame from "@/components/InspectionFrame";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Business Systems & Website Pricing",
  "Transparent starting points for websites, website care, advertising, and focused improvements; substantial custom systems are scoped individually.",
  "/pricing",
);

type PricingCategory = {
  id: string;
  aliases?: string[];
  number: string;
  frameLabel: string;
  title: string;
  price: string;
  details: string[];
  qualifier: string;
};

const pricingCategories: PricingCategory[] = [
  {
    id: "build",
    number: "02",
    frameLabel: "WEBSITES",
    title: "Custom Websites",
    price: "Focused business websites begin around $3,000.",
    details: [
      "Broader website projects with expanded content, conversion tracking, or integrations begin around $5,500.",
      "Customer-facing website integrations are scoped with the website. Substantial custom business applications are considered separately.",
    ],
    qualifier:
      "Final website pricing depends on scope, content, integrations, technical requirements, and business goals.",
  },
  {
    id: "care",
    number: "03",
    frameLabel: "ONGOING SUPPORT",
    title: "Website Care",
    price: "Plans range from $149 to $599 per month.",
    details: [
      "The range reflects different levels of managed hosting, monitoring, included update time, performance review, and ongoing support.",
    ],
    qualifier:
      "The appropriate plan is recommended after reviewing the website and its ongoing support requirements.",
  },
  {
    id: "grow",
    aliases: ["launch"],
    number: "04",
    frameLabel: "DIGITAL ADVERTISING",
    title: "Advertising Management",
    price: "Ongoing management begins at $299 per month.",
    details: [
      "Most actively managed local campaigns fall around $449 per month, excluding advertising spend.",
    ],
    qualifier:
      "Pricing depends on campaign complexity, locations, platforms, and the level of ongoing optimization required.",
  },
  {
    id: "evolve",
    number: "01",
    frameLabel: "BUSINESS SYSTEMS",
    title: "Custom Systems & Practical Improvements",
    price:
      "Substantial custom systems are scoped individually after discovery.",
    details: [
      "Focused automation or integration projects typically begin around $2,000 when the problem can be solved within a limited scope.",
      "Custom applications, portals, internal tools, and multi-system workflows require a defined architecture and proposal based on their requirements.",
    ],
    qualifier:
      "The proposal distinguishes the cost of diagnosis, implementation, third-party tools, ownership, and ongoing support as applicable.",
  },
];

const orderedPricingCategories = [
  pricingCategories[3],
  pricingCategories[0],
  pricingCategories[1],
  pricingCategories[2],
];

const engagementNotes = [
  {
    title: "Reviewed before it is quoted",
    copy: "Published figures are planning ranges, not guaranteed quotes. Every engagement is reviewed before final pricing is confirmed in writing.",
  },
  {
    title: "Separate costs stay visible",
    copy: "Advertising spend, domains, business email, premium software, and third-party platform fees are separate unless the written proposal expressly includes them. Advertising results cannot be guaranteed, and client advertising accounts remain client-owned.",
  },
  {
    title: "The proposal defines the relationship",
    copy: "The proposal confirms scope, deliverables, schedule, ownership, payment terms, and investment. Care-plan eligibility, hosting responsibilities, included support, and additional-work rates are confirmed after technical review.",
  },
] as const;

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title={
          <>
            Clear starting points.
            <br />
            <span className="italic text-foothill">
              Scope confirmed together.
            </span>
          </>
        }
      >
        Use these starting points to judge fit. Website, care, advertising, and
        focused-project prices stay visible; larger systems receive a written
        scope and investment after the business problem has been reviewed.
      </PageHero>

      <section
        id="pricing-overview"
        className="pricing-anchor section-pad bg-ivory"
      >
        <div className="container-x">
          <SectionHeading
            eyebrow="Qualified Transparency"
            title="Clear starting points and a defined custom scope"
            copy="The right investment depends on the problem, existing tools, users, technical requirements, and support needs. We recommend a simpler approach when it fits."
          />
          <div className="mt-14 grid items-stretch gap-6 md:auto-rows-fr md:grid-cols-2">
            {orderedPricingCategories.map((category) => (
              <PricingCategoryCard key={category.id} category={category} />
            ))}
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-6 border-y border-charcoal/15 py-7 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <h2 className="font-serif text-2xl text-charcoal">
                Have a project in mind?
              </h2>
              <p className="mt-2 text-sm text-charcoal-soft">
                Share what you are considering, and we can determine the right
                scope and a realistic expected investment.
              </p>
            </div>
            <Link
              href="/contact"
              className="btn-brass group shrink-0"
              data-analytics-event="Consultation CTA Clicked"
              data-analytics-location="pricing_overview"
              data-analytics-target="contact"
            >
              Start an Inquiry
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="section-pad bg-ivory-deep"
        aria-labelledby="pricing-notes-title"
      >
        <div className="container-x grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="eyebrow mb-5">Before Work Begins</p>
            <h2
              id="pricing-notes-title"
              className="heading-serif text-[clamp(2rem,4vw,3.35rem)] text-charcoal"
            >
              A clear proposal, not a surprise invoice
            </h2>
            <p className="mt-5 text-lg text-charcoal-soft">
              Enough information to plan now, with the details documented before
              either side commits.
            </p>
          </div>
          <ol className="divide-y divide-charcoal/15 border-y border-charcoal/15">
            {engagementNotes.map((note, index) => (
              <li
                key={note.title}
                className="grid gap-3 py-6 sm:grid-cols-[2.5rem_1fr] sm:gap-5"
              >
                <span
                  className="font-serif text-lg italic text-brass-deep"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-serif text-xl text-charcoal">
                    {note.title}
                  </h3>
                  <p className="mt-2 text-sm text-charcoal-soft">{note.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CTASection
        title="Not sure where your project fits?"
        copy="A brief consultation will help identify the right scope, confirm whether Pierce Business Integrations is a good fit, and establish the expected investment before work begins."
        buttonLabel="Schedule a Consultation"
      />
      <Footer />
    </>
  );
}

function PricingCategoryCard({ category }: { category: PricingCategory }) {
  return (
    <div
      id={category.id}
      className="pricing-anchor relative h-full"
      data-analytics-view="Pricing Category Viewed"
      data-analytics-location="pricing_page"
      data-analytics-target={category.id}
    >
      {category.aliases?.map((alias) => (
        <span
          key={alias}
          id={alias}
          className="pricing-anchor absolute left-0 top-0"
          aria-hidden="true"
        />
      ))}
      <InspectionFrame
        as="article"
        label={category.frameLabel}
        className="flex h-full flex-col border border-charcoal/15 bg-ivory-deep p-7 md:p-9"
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-brass-deep">
          {category.number} / {category.frameLabel}
        </p>
        <h3 className="heading-serif mt-4 text-3xl text-charcoal md:text-4xl">
          {category.title}
        </h3>
        <p className="mt-6 font-serif text-[clamp(1.55rem,3vw,2.15rem)] leading-tight text-foothill-deep">
          {category.price}
        </p>
        <div className="mt-6 grid gap-4 text-charcoal-soft">
          {category.details.map((detail) => (
            <p key={detail}>{detail}</p>
          ))}
        </div>
        <div className="mt-auto pt-7">
          <p className="border-l-2 border-brass pl-4 text-sm text-charcoal-soft">
            {category.qualifier}
          </p>
        </div>
      </InspectionFrame>
    </div>
  );
}
