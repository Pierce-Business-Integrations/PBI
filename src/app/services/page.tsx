import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import ServiceSummary from "@/components/ServiceSummary";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { pageMetadata, featuredServices } from "@/lib/site";
import styles from "@/components/Services.module.css";

export const metadata: Metadata = pageMetadata(
  "Business Solutions & Custom Systems",
  "Operational problem diagnosis, custom business systems, websites, website care, and advertising for North Georgia businesses.",
  "/services",
);

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title={
          <>
            Understand the problem.
            <br />
            Deliver a working solution.
          </>
        }
      >
        We understand the business problem before recommending a process change,
        existing platform, integration, custom application, website, or
        advertising system.
      </PageHero>
      <section id="service-options" className={styles.section}>
        <div className={styles.container}>
          <SectionHeading title="From operational systems to customer-facing work" />
          <div className={styles.summaryList}>
            {featuredServices.map((service) => (
              <ServiceSummary key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </section>
      <section className={styles.mutedSection}>
        <div className={`${styles.container} ${styles.partnership}`}>
          <div>
            <h2>The Problem</h2>
            <p>
              We identify the point of friction, missed opportunity, or unclear
              customer experience.
            </p>
          </div>
          <div>
            <h2>The Scope</h2>
            <p>
              You receive a clear recommendation, deliverables, timeline, and
              price before work begins.
            </p>
          </div>
          <div>
            <h2>The Partnership</h2>
            <p>
              You work directly with the PBI team and have a clear path for
              support after launch.
            </p>
          </div>
        </div>
      </section>
      <CTASection />
      <Footer />
    </>
  );
}
