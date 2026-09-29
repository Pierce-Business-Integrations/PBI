import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import PageHero from "./PageHero";
import SectionHeading from "./SectionHeading";
import CTASection from "./CTASection";
import Footer from "./Footer";
import ServiceSpecificSection from "./ServiceSpecificSection";
import WireframeReveal from "./WireframeReveal";
import { site, type Service } from "@/lib/site";

export default function ServiceDetailPage({ service }: { service: Service }) {
  return (
    <>
      <PageHero
        eyebrow={service.shortTitle}
        title={service.title}
        breadcrumbs={[
          { label: "Solutions", href: "/services" },
          {
            label: service.shortTitle,
            href: `/services/${service.slug}`,
          },
        ]}
      >
        {service.description}
      </PageHero>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.shortTitle,
            serviceType: service.shortTitle,
            description: service.description,
            url: `${site.url}/services/${service.slug}`,
            provider: { "@id": `${site.url}/#organization` },
            areaServed: [
              "North Georgia",
              "Gwinnett County, Georgia",
              "Hall County, Georgia",
              "Barrow County, Georgia",
              "Forsyth County, Georgia",
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />
      <section className="section-pad bg-ivory">
        <div className="container-x grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="The Opportunity"
              title="Solve the right problem first"
              copy={service.intro}
            />
            <p className="mt-7 border-l-2 border-foothill pl-6 text-lg text-charcoal-soft">
              {service.problem}
            </p>
          </div>
          <aside className="border-y border-charcoal/15 py-8 lg:mt-2">
            <p className="eyebrow mb-4">A Strong Fit For</p>
            <p className="text-charcoal-soft">{service.fit}</p>
            <Link
              href="/contact"
              data-analytics-event="Consultation CTA Clicked"
              data-analytics-location="service_detail_fit"
              data-analytics-target={service.slug}
              className="mt-7 inline-flex items-center gap-2 font-medium text-charcoal underline decoration-foothill underline-offset-4"
            >
              Discuss your project <ArrowRight size={17} />
            </Link>
          </aside>
        </div>
      </section>
      <section className="section-pad bg-ivory-deep">
        <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading
            eyebrow={
              service.slug === "automation"
                ? "Possible Deliverables"
                : "Typical Deliverables"
            }
            title={
              service.slug === "automation"
                ? "Scope follows the business problem"
                : "A focused scope built around your goals"
            }
            copy="The final project may include a combination of the following, confirmed in a written proposal after discovery."
          />
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {service.deliverables.map((item) => (
              <li
                key={item}
                className="flex gap-3 border-b border-charcoal/15 py-4 text-charcoal-soft"
              >
                <Check size={18} className="mt-1 shrink-0 text-foothill" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <ServiceSpecificSection slug={service.slug} />
      {service.slug === "web-design" && (
        <section id="structure-to-experience" className="section-pad bg-ivory">
          <div className="container-x">
            <SectionHeading
              eyebrow="From Structure to Experience"
              title="Every polished interface begins with a clear plan"
              copy="We map the customer journey, organize the content, and establish the technical foundation before refining the final visual experience."
            />
            <div className="mt-12">
              <WireframeReveal />
            </div>
          </div>
        </section>
      )}
      <section className="bg-ivory py-14">
        <div className="container-x">
          <p className="max-w-4xl font-serif text-xl italic leading-relaxed text-charcoal">
            {service.closing}
          </p>
        </div>
      </section>
      <CTASection
        title={
          service.slug === "automation"
            ? "Let’s understand what is slowing your business down."
            : `Let’s talk about ${service.shortTitle.toLowerCase()}.`
        }
      />
      <Footer />
    </>
  );
}
