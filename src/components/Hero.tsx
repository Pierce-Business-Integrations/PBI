import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-[100svh] overflow-hidden bg-charcoal text-ivory lg:min-h-[calc(100dvh-5rem)]"
    >
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/images/hero7.jpg"
          alt="Golden-hour aerial view of a North Georgia lake and wooded shoreline"
          fill
          preload
          quality={75}
          sizes="100vw"
          className="
      animate-slow-zoom
      lg:animate-none
      motion-reduce:animate-none
      object-cover
      object-[58%_32%]
      saturate-[0.86]
      contrast-[1.01]
      brightness-[0.95]
      sm:object-[center_30%]
    "
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,23,0.74)_0%,rgba(11,24,28,0.56)_35%,rgba(20,33,31,0.26)_62%,rgba(15,25,24,0.06)_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,13,18,0.28)_0%,transparent_40%,rgba(4,12,16,0.12)_100%)]"
          aria-hidden="true"
        />
      </div>

      <div
        className="grid-texture-light pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-35"
        aria-hidden="true"
      />

      <div className="container-x relative grid min-h-[100svh] items-center lg:min-h-[calc(100dvh-5rem)]">
        <div className="hero-content max-w-xl pb-16 pt-24 lg:max-w-3xl lg:pb-8 lg:pt-24 xl:max-w-4xl">
          <p className="hero-eyebrow eyebrow mb-6 text-foothill-light">
            Pierce Business Integrations · North Georgia
          </p>

          <h1
            aria-label="Better Operations. Built Around Your Business."
            className="heading-serif text-[clamp(2.25rem,10vw,4.4rem)] text-ivory sm:text-[clamp(2.6rem,5.2vw,4.4rem)]"
          >
            <span aria-hidden="true">
              Better Operations.
              <br />
              Built Around{" "}
              <span className="italic text-[#9eab77]">Your Business.</span>
            </span>
          </h1>

          <p className="hero-description mt-7 max-w-lg text-lg text-ivory/78 lg:max-w-xl xl:max-w-2xl">
            Tell us where work gets stuck. We’ll understand the problem, improve
            the process, and implement the right solution, from better use of
            your current tools to an integration, custom application, website,
            or advertising system.
          </p>

          <div className="hero-actions mt-9 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="btn-brass group"
              data-analytics-event="Consultation CTA Clicked"
              data-analytics-location="homepage_hero"
              data-analytics-target="contact"
            >
              Discuss a Business Problem
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/services"
              className="btn-outline-light"
              data-analytics-event="Services Overview Clicked"
              data-analytics-location="homepage_hero"
              data-analytics-target="services"
            >
              Explore Solutions
            </Link>
          </div>

          <div className="hero-signoff mt-12 max-w-sm">
            <div className="ornament mb-3">
              <span className="text-[#9eab77]">&#9670;</span>
            </div>
            <p className="text-center font-serif text-lg italic text-ivory/60">
              Modern solutions. Local partnership.
            </p>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#services"
        aria-label="Scroll to services"
        className="absolute bottom-8 left-1/2 hidden h-11 w-7 -translate-x-1/2 justify-center rounded-full border border-ivory/40 pt-2 lg:flex"
      >
        <span className="h-2 w-[3px] animate-scroll-dot rounded-full bg-ivory/65" />
      </a>
    </section>
  );
}
