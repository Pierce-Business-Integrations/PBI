import InspectionFrame from "./InspectionFrame";

const stages = [
  {
    number: "01",
    name: "Build",
    type: "One-time",
    href: "#build",
    title: "Choose the Right Starting Point",
    copy: "Start with a clearly scoped project built around the needs, goals, and current stage of your business.",
    services:
      "Foundation Website, Growth Website, Custom Web Platform, Focused Landing Page, Automation Implementation",
  },
  {
    number: "02",
    name: "Launch",
    type: "Optional",
    href: "#launch",
    title: "Prepare to Produce Measurable Opportunities",
    copy: "Launch with the tracking, systems, and optional advertising support needed to understand what happens after the website goes live.",
    services:
      "Technical launch, analytics, conversion tracking, Lead Generation Launch, advertising setup or remediation",
  },
  {
    number: "03",
    name: "Care",
    type: "Ongoing",
    href: "#care",
    title: "Keep the Website Healthy and Useful",
    copy: "Continue with the level of monitoring, updates, support, and improvement appropriate for the role your website plays in the business.",
    services: "Essential Care, Business Care, Priority Care",
  },
  {
    number: "04",
    name: "Grow",
    type: "Ongoing",
    href: "#grow",
    title: "Actively Generate and Improve Results",
    copy: "Add ongoing advertising, automation, reporting, and optimization as the business becomes ready for a more active growth strategy.",
    services:
      "Advertising Oversight, Local Ads Management, Growth Ads Management, Automation Management, conversion improvements",
  },
  {
    number: "05",
    name: "Evolve",
    type: "As needed",
    href: "#evolve",
    title: "Build the Next Useful Thing",
    copy: "Return for focused projects as new opportunities, operational needs, and growth stages emerge.",
    services:
      "Landing pages, additional locations, integrations, internal tools, portals, workflow automation, custom applications",
  },
] as const;

export default function PricingLifecycle() {
  return (
    <section className="section-pad bg-ivory" aria-labelledby="lifecycle-title">
      <div className="container-x">
        <p className="eyebrow">Client Lifecycle</p>
        <h2
          id="lifecycle-title"
          className="heading-serif mt-4 text-4xl md:text-5xl"
        >
          Your Path with Pierce Business Integrations
        </h2>
        <p className="mt-5 max-w-3xl text-charcoal-soft">
          Start with what your business needs now, then add support,
          advertising, automation, and future projects as those needs evolve.
        </p>
        <div className="pricing-lifecycle mt-12">
          <span className="pricing-lifecycle__line" aria-hidden="true" />
          {stages.map((stage) => (
            <InspectionFrame
              key={stage.name}
              as="a"
              href={stage.href}
              dataAnalyticsEvent="Pricing Navigation Clicked"
              dataAnalyticsLocation="pricing_lifecycle"
              dataAnalyticsTarget={stage.name.toLowerCase()}
              label={stage.type}
              className="pricing-lifecycle__stage"
            >
              <span className="pricing-lifecycle__node" aria-hidden="true" />
              <span className="flex flex-wrap items-center justify-between gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-taupe">
                <span>
                  {stage.number} / {stage.name}
                </span>
                <span className="text-brass-deep">{stage.type}</span>
              </span>
              <h3 className="mt-4 font-serif text-xl text-charcoal">
                {stage.title}
              </h3>
              <p className="mt-3 text-sm text-charcoal-soft">{stage.copy}</p>
              <p className="mt-4 text-xs leading-relaxed text-taupe">
                {stage.services}
              </p>
              <span className="mt-5 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-foothill-deep">
                View {stage.name}
              </span>
            </InspectionFrame>
          ))}
        </div>
        <p className="mt-9 max-w-4xl border-l-2 border-brass pl-5 text-sm text-charcoal-soft">
          Every business enters at a different stage. Some clients begin with a
          complete website project, while others come to Pierce Business
          Integrations for tracking repairs, advertising management, automation,
          or improvements to an existing platform.
        </p>
      </div>
    </section>
  );
}
