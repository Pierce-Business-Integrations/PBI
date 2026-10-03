import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import TeamPortrait from "@/components/TeamPortrait";
import TopographicContours from "@/components/TopographicContours";
import { GeorgiaSeal } from "@/components/GeorgiaServiceAreaMap";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "About Our Team",
  "Meet Jacob, Mark, and Michael Pierce, the family-owned North Georgia team behind practical business systems, integrations, websites, and direct support.",
  "/about",
);

const teamMembers = [
  {
    name: "Jacob Pierce",
    role: "Founder & Solutions Architect",
    image: "/images/jacob.png",
    imageClassName: "origin-center scale-[1.2] object-[58%_center]",
  },
  {
    name: "Mark Pierce",
    role: "Director of Business Development",
    image: "/images/mark-pierce.webp",
    imageClassName: "object-[50%_25%]",
  },
  {
    name: "Michael Pierce",
    role: "AI & Systems Engineer",
    image: "/images/michael-pierce.webp",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Pierce Business Integrations"
        title={
          <>
            Local perspective.
            <br />
            <span className="italic text-foothill">Direct partnership.</span>
          </>
        }
      >
        Pierce Business Integrations helps North Georgia businesses use
        technology with more clarity, confidence, and practical purpose.
      </PageHero>
      <section className="section-pad bg-ivory">
        <div className="container-x">
          <SectionHeading
            eyebrow="Family-owned. Locally rooted."
            title="A family-owned team focused on the business behind the technology"
            copy={
              <>
                <p>
                  We’re the Pierce family. We work with North Georgia businesses
                  to understand how the work gets done, what gets in the way,
                  and what needs to improve. Then we choose and implement
                  practical solutions that fit the business and the people using
                  them.
                </p>
                <p className="mt-5">
                  You work directly with us, from the first conversation through
                  planning, implementation, and ongoing support. We bring
                  careful work, honest recommendations, and clear communication
                  to each step.
                </p>
              </>
            }
          />
          <div
            id="team"
            className="mt-14 grid scroll-mt-36 gap-12 md:grid-cols-3 md:gap-6 lg:mt-16 xl:gap-10"
          >
            {teamMembers.map((member) => (
              <TeamPortrait key={member.name} {...member} />
            ))}
          </div>
        </div>
        <div
          id="service-member-owned"
          className="container-x mt-16 grid scroll-mt-28 items-center gap-9 border-y border-charcoal/15 py-9 md:grid-cols-[0.75fr_1.25fr] lg:mt-20 lg:gap-14 lg:py-11"
        >
          <figure className="pointer-events-none mx-auto w-full max-w-[420px] select-none">
            <div className="relative pb-2.5 pr-2.5">
              <div
                className="absolute bottom-0 right-0 h-[calc(100%-0.625rem)] w-[calc(100%-0.625rem)] border border-brass/50"
                aria-hidden="true"
              />
              <div className="relative aspect-[4/5] overflow-hidden border border-brass/35 bg-charcoal sm:aspect-[5/4]">
                <Image
                  src="/images/jacob-marine-corps-reserve.png"
                  alt="Jacob Pierce in a United States Marine Corps uniform"
                  fill
                  sizes="(max-width: 767px) 90vw, 420px"
                  quality={75}
                  draggable={false}
                  className="pointer-events-none select-none object-cover object-[50%_42%] saturate-[0.76] sepia-[0.1]"
                />
                <div
                  className="absolute inset-0 bg-[#c7aa6a]/15 mix-blend-color"
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-charcoal/25 via-transparent to-ivory/5"
                  aria-hidden="true"
                />
              </div>
            </div>
            <figcaption className="mt-3 text-center text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-taupe">
              Jacob Pierce <span className="text-brass">&middot;</span> Marine
              Corps Reserve
            </figcaption>
          </figure>
          <div className="max-w-2xl">
            <p className="eyebrow">Service-member-owned</p>
            <h2 className="heading-serif mt-3 text-[clamp(2rem,4vw,3.35rem)] text-charcoal">
              Service, carried into the work
            </h2>
            <p className="mt-5 text-charcoal-soft">
              Pierce Business Integrations is a service-member-owned business.
              Founder Jacob Pierce currently serves in the United States Marine
              Corps Reserve, and that experience reinforces the same qualities
              we bring to client work: preparation, accountability, clear
              communication, and dependable follow-through.
            </p>
          </div>
        </div>
      </section>
      <section className="bg-charcoal py-14 text-ivory md:py-16">
        <div className="container-x relative overflow-hidden border border-ivory/15 px-7 py-9 md:px-10">
          <TopographicContours className="absolute -bottom-24 -right-24 w-[34rem] text-foothill-light opacity-10" />
          <div className="relative grid items-center gap-7 md:grid-cols-[auto_1fr]">
            <GeorgiaSeal className="h-20 w-20 text-brass" />
            <div className="max-w-3xl">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.17em] text-brass-light">
                Based in Auburn, Georgia
              </p>
              <h2 className="mt-3 font-serif text-3xl">Why North Georgia</h2>
              <p className="mt-3 text-ivory/70">
                This is home. We understand the businesses, communities, and
                relationships that keep this area moving. We work to provide
                those businesses with a direct and capable technology partner.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="section-pad bg-ivory-deep">
        <div className="container-x">
          <SectionHeading
            eyebrow="How We Work"
            title="Understand the business before choosing the technology"
            copy="The best technical solution is not always the largest or most complicated one. It is the one that addresses the real constraint, fits the team, and can be supported over time."
          />
          <div className="mt-14 grid border-y border-charcoal/15 md:grid-cols-3">
            <article className="py-8 md:pr-9">
              <h3 className="font-serif text-2xl">Listen closely</h3>
              <p className="mt-3 text-charcoal-soft">
                Understand the customers, workflow, priorities, and constraints
                before prescribing technology.
              </p>
            </article>
            <article className="border-y border-charcoal/15 py-8 md:border-x md:border-y-0 md:px-9">
              <h3 className="font-serif text-2xl">Build deliberately</h3>
              <p className="mt-3 text-charcoal-soft">
                Create a clear, maintainable solution shaped around the business
                rather than a rigid template.
              </p>
            </article>
            <article className="py-8 md:pl-9">
              <h3 className="font-serif text-2xl">Stay involved</h3>
              <p className="mt-3 text-charcoal-soft">
                Offer a direct path for support, review, and thoughtful
                improvements as the business changes.
              </p>
            </article>
          </div>
        </div>
      </section>
      <CTASection />
      <Footer />
    </>
  );
}
