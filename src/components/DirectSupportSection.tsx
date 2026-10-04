import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "./SectionHeading";

const principles = [
  {
    number: "01",
    title: "One consistent point of contact",
    copy: "Work directly with the person designing and building the solution.",
  },
  {
    number: "02",
    title: "Context that carries forward",
    copy: "You do not have to re-explain your business every time you need help.",
  },
  {
    number: "03",
    title: "Practical recommendations",
    copy: "Decisions are based on usefulness, not on selling the most technology.",
  },
  {
    number: "04",
    title: "Support beyond launch",
    copy: "The relationship continues as the business and platform evolve.",
  },
] as const;

export default function DirectSupportSection() {
  return (
    <section
      id="direct-support"
      className="section-pad scroll-mt-24 overflow-hidden bg-ivory-deep"
    >
      <div className="container-x grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-28">
          <SectionHeading
            title="Direct support from someone who knows your business."
            copy="Work directly with the person designing and building your solution, from the first conversation through launch and ongoing support."
          />
          <Link
            href="/about"
            className="mt-8 inline-flex items-center gap-2 font-medium text-charcoal underline decoration-foothill underline-offset-4 hover:text-foothill-deep"
          >
            Learn how the partnership works
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <div className="support-principles grid-texture">
          <p className="eyebrow border-b border-charcoal/15 pb-5 text-brass-deep">
            What Direct Support Means
          </p>
          <ol className="support-principles__list">
            {principles.map((principle) => (
              <li key={principle.number} className="support-principles__item">
                <span className="support-principles__node" aria-hidden="true" />
                <span className="font-serif text-lg italic text-brass-deep">
                  {principle.number}
                </span>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-charcoal">
                    {principle.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
                    {principle.copy}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
