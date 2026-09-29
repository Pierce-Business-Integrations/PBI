import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection({
  title = "Let’s build something useful for your business.",
  copy = "Start with a practical conversation about where you are, what is getting in the way, and what the right next step could look like.",
  buttonLabel = "Discuss a Business Problem",
}: {
  title?: string;
  copy?: string;
  buttonLabel?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-foothill-deep py-20 text-ivory md:py-28">
      <div
        className="grid-texture-light absolute inset-0 opacity-60"
        aria-hidden="true"
      />
      <div className="container-x relative grid items-end gap-8 lg:grid-cols-[1fr_auto]">
        <div className="max-w-3xl">
          <p className="eyebrow mb-5 text-brass-light">Start a Conversation</p>
          <h2 className="heading-serif text-[clamp(2.1rem,4vw,3.5rem)]">
            {title}
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-ivory/75">{copy}</p>
        </div>
        <Link
          href="/contact"
          className="btn-brass group w-fit"
          data-analytics-event="Consultation CTA Clicked"
          data-analytics-location="section_cta"
          data-analytics-target="contact"
        >
          {buttonLabel}{" "}
          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>
    </section>
  );
}
