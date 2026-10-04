import SectionHeading from "./SectionHeading";
import ServiceSummary from "./ServiceSummary";
import CTASection from "./CTASection";
import GrowthLifecycle from "./GrowthLifecycle";
import DirectSupportSection from "./DirectSupportSection";
import SimplifiedProcess from "./SimplifiedProcess";
import { featuredServices } from "@/lib/site";

const homepageServiceCopy: Record<string, string> = {
  "web-design":
    "A clear, dependable customer experience when your website is the right place to improve.",
  "website-care":
    "Ongoing monitoring, updates, and direct support that keep your website reliable after launch.",
  automation:
    "Custom applications, integrations, and operational tools designed around the real work your team does.",
  advertising:
    "Focused campaigns, landing pages, and tracking designed around qualified leads and bookings.",
};

export default function HomeSections() {
  return (
    <>
      <section id="services" className="section-pad bg-ivory">
        <div className="container-x">
          <SectionHeading
            title="Start with the problem. Choose the right solution."
            copy="We diagnose friction, design a practical way forward, and deliver working solutions. Custom systems and integrations lead our work; websites, care, and advertising are here when those are the right answer."
          />
          <p className="mt-6 max-w-3xl border-l-2 border-brass pl-5 text-charcoal-soft">
            Built for service companies, professional offices, contractors,
            retailers, nonprofits, and other growing organizations across North
            Georgia.
          </p>
          <div className="mt-12">
            {featuredServices.map((service) => (
              <ServiceSummary
                key={service.slug}
                service={service}
                description={homepageServiceCopy[service.slug]}
              />
            ))}
          </div>
        </div>
      </section>

      <GrowthLifecycle />
      <DirectSupportSection />
      <SimplifiedProcess />

      <CTASection />
    </>
  );
}
