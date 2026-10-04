import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import PageHero from "./PageHero";
import SectionHeading from "./SectionHeading";
import CTASection from "./CTASection";
import Footer from "./Footer";
import ServiceSpecificSection from "./ServiceSpecificSection";
import WireframeReveal from "./WireframeReveal";
import PageIllustration, { type IllustrationTopic } from "./PageIllustration";
import styles from "./Services.module.css";
import { site, type Service } from "@/lib/site";

const serviceIllustrations: Partial<Record<string, IllustrationTopic>> = {
  automation: "systems",
  "web-design": "website",
  "website-care": "care",
  advertising: "advertising",
};

export default function ServiceDetailPage({ service }: { service: Service }) {
  const illustration = serviceIllustrations[service.slug];

  return (
    <>
      <PageHero
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
      <section className={styles.section}>
        <div
          className={`${styles.container} ${styles.intro} ${illustration ? styles.introWithIllustration : ""}`}
        >
          <div>
            <SectionHeading
              title="Solve the right problem first"
              copy={service.intro}
            />
            <p className={styles.problem}>{service.problem}</p>
            <Link
              href="/contact"
              data-analytics-event="Consultation CTA Clicked"
              data-analytics-location="service_detail_fit"
              data-analytics-target={service.slug}
              className={`${styles.textLink} ${styles.introAction}`}
            >
              Discuss your project <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          {illustration && (
            <PageIllustration
              topic={illustration}
              className={styles.serviceIllustration}
            />
          )}
        </div>
      </section>
      <section className={styles.mutedSection}>
        <div className={`${styles.container} ${styles.deliverableLayout}`}>
          <SectionHeading
            title={
              service.slug === "automation"
                ? "Scope follows the business problem"
                : "A focused scope built around your goals"
            }
            copy="The final project may include a combination of the following, confirmed in a written proposal after discovery."
          />
          <ul className={styles.deliverables} role="list">
            {service.deliverables.map((item) => (
              <li key={item}>
                <Check size={18} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <ServiceSpecificSection slug={service.slug} />
      {service.slug === "web-design" && (
        <section id="structure-to-experience" className={styles.section}>
          <div className={styles.container}>
            <SectionHeading
              title="Every polished interface begins with a clear plan"
              copy="We map the customer journey, organize the content, and establish the technical foundation before refining the final visual experience."
            />
            <div className="mt-12">
              <WireframeReveal />
            </div>
          </div>
        </section>
      )}
      <section className={styles.closing}>
        <div className={styles.container}>
          <p>{service.closing}</p>
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
