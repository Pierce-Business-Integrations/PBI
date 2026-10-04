import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Footer from "../Footer";
import HeroBackground from "./HeroBackground";
import HeroHeadline from "./HeroHeadline";
import PageEntrance from "../PageEntrance";
import styles from "./Homepage.module.css";

const capabilities = [
  {
    title: "Custom software",
    copy: "Internal tools, client portals, and business applications built around the way your team works.",
  },
  {
    title: "Systems integration",
    copy: "Connect the tools you already use, so information moves with the work instead of being entered twice.",
  },
  {
    title: "Practical AI",
    copy: "Put AI to work on useful tasks, with a clear purpose, sensible boundaries, and human review where needed.",
  },
];

const supportingServices = [
  { label: "Websites", slug: "web-design" },
  { label: "Website care", slug: "website-care" },
  { label: "Advertising", slug: "advertising" },
];

const process = [
  {
    title: "Understand the work",
    copy: "Listen to your team, follow the workflow, and identify where time, information, or momentum gets lost.",
  },
  {
    title: "Choose the right approach",
    copy: "Define the solution, scope, and investment. Sometimes the answer is a simpler process or better use of what you already have.",
  },
  {
    title: "Build and stay involved",
    copy: "Implement carefully, help your team get comfortable, and plan for support and improvement after launch.",
  },
];

function ProjectLink({ location }: { location: string }) {
  return (
    <Link
      href="/contact"
      className={styles.primaryButton}
      data-analytics-event="Consultation CTA Clicked"
      data-analytics-location={location}
      data-analytics-target="contact"
    >
      Discuss your project <ArrowUpRight size={18} aria-hidden="true" />
    </Link>
  );
}

export default function HomePage({ className }: { className: string }) {
  return (
    <div className={className}>
      <section id="top" className={styles.hero} aria-labelledby="home-heading">
        <HeroBackground>
          <source
            media="(max-width: 767px)"
            srcSet="/images/homepage/pbi-gradient-mobile.webp"
          />
          <Image
            src="/images/homepage/pbi-gradient.webp"
            alt=""
            fill
            unoptimized
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className={styles.gradient}
          />
        </HeroBackground>
        <div className={styles.heroFade} aria-hidden="true" />
        <PageEntrance className={styles.heroContent}>
          <HeroHeadline />
          <p className={styles.heroCopy}>
            We build custom software, connect your tools, and put AI to work so
            your business runs with less friction and more possibility.
          </p>
          <div className={styles.heroActions}>
            <ProjectLink location="homepage_hero" />
            <Link
              href="/services"
              className={styles.textLink}
              data-analytics-event="Services Overview Clicked"
              data-analytics-location="homepage_hero"
              data-analytics-target="services"
            >
              Explore solutions <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <p className={styles.heroLocal}>
            Family-run. Based in North Georgia.
          </p>
        </PageEntrance>
      </section>

      <section
        id="services"
        className={styles.section}
        aria-labelledby="solutions-heading"
      >
        <div className={styles.container}>
          <div className={styles.solutionsLayout}>
            <div>
              <h2 id="solutions-heading" className={styles.sectionHeading}>
                Make the work
                <br /> flow better.
              </h2>
              <p className={styles.sectionCopy}>
                Scattered information. Disconnected tools. Everyday tasks that
                take too many steps. We find the friction and build a practical
                way forward.
              </p>
              <p className={styles.audience}>
                For service businesses, professional offices, contractors, and
                growing teams.
              </p>
            </div>
            <div className={styles.capabilities}>
              {capabilities.map((capability) => (
                <Link
                  key={capability.title}
                  href="/services/automation"
                  className={styles.capability}
                  data-analytics-event="Service Explored"
                  data-analytics-location="homepage_services"
                  data-analytics-target="automation"
                >
                  <div>
                    <h3>{capability.title}</h3>
                    <p>{capability.copy}</p>
                  </div>
                  <ArrowUpRight size={22} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
          <div className={styles.supportingServices}>
            <p>A stronger online presence belongs in the picture, too.</p>
            <div>
              {supportingServices.map((service) => (
                <Link
                  key={service.slug}
                  href={"/services/" + service.slug}
                  className={styles.textLink}
                  data-analytics-event="Service Explored"
                  data-analytics-location="homepage_services"
                  data-analytics-target={service.slug}
                >
                  {service.label} <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="process"
        className={styles.processSection}
        aria-labelledby="process-heading"
      >
        <div className={styles.container}>
          <span
            id="growth-lifecycle"
            className={styles.anchor}
            aria-hidden="true"
          />
          <div className={styles.sectionIntro}>
            <div>
              <h2 id="process-heading" className={styles.sectionHeading}>
                Understand first.
                <br /> Build with purpose.
              </h2>
            </div>
            <p className={styles.sectionCopy}>
              We start with your business, not a preselected piece of
              technology. The right solution should fit the problem, your team,
              and the way you want to work.
            </p>
          </div>
          <ol className={styles.processSteps} role="list">
            {process.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </li>
            ))}
          </ol>
          <div className={styles.engagementNote}>
            <p>Clear scope. Clear costs. A plan before we build.</p>
            <Link
              href="/how-we-work"
              className={styles.textLink}
              data-analytics-event="How We Work Navigation Clicked"
              data-analytics-location="homepage_process"
              data-analytics-target="how-we-work"
            >
              Our Approach <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section
        className={styles.contactSection}
        aria-labelledby="conversation-heading"
      >
        <div className={styles.container}>
          <h2 id="conversation-heading" className={styles.contactHeading}>
            Start with what’s
            <br /> getting in the way.
          </h2>
          <div className={styles.contactActions}>
            <p>
              You don’t need a technical brief. Tell us where the work feels
              harder than it should.
            </p>
            <ProjectLink location="section_cta" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
