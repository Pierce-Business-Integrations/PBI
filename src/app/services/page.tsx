import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import ServiceSummary from "@/components/ServiceSummary";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { pageMetadata, featuredServices } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Business Solutions & Custom Systems",
  "Operational problem diagnosis, custom business systems, websites, website care, and advertising for North Georgia businesses.",
  "/services",
);

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title={
          <>
            Understand the problem.
            <br />
            <span className="italic text-foothill">
              Deliver a working solution.
            </span>
          </>
        }
      >
        We understand the business problem before recommending a process change,
        existing platform, integration, custom application, website, or
        advertising system.
      </PageHero>
      <section id="service-options" className="section-pad bg-ivory">
        <div className="container-x">
          <SectionHeading
            eyebrow="Ways We Can Help"
            title="From operational systems to customer-facing work"
          />
          <div className="mt-14">
            {featuredServices.map((service) => (
              <ServiceSummary key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </section>
      <section className="section-pad bg-ivory-deep">
        <div className="container-x grid gap-8 md:grid-cols-3">
          <div>
            <p className="eyebrow mb-4">The Problem</p>
            <p className="text-charcoal-soft">
              We identify the point of friction, missed opportunity, or unclear
              customer experience.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-4">The Scope</p>
            <p className="text-charcoal-soft">
              You receive a clear recommendation, deliverables, timeline, and
              price before work begins.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-4">The Partnership</p>
            <p className="text-charcoal-soft">
              You work directly with Jacob and have a clear path for support
              after launch.
            </p>
          </div>
        </div>
      </section>
      <CTASection />
      <Footer />
    </>
  );
}
