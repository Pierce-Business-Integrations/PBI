import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "./SectionHeading";

const stages = [
  {
    number: "01",
    label: "Understand the constraint",
    title: "Find where work breaks down",
    copy: "Map the people, steps, tools, and costs before choosing an approach.",
  },
  {
    number: "02",
    label: "Architect the approach",
    title: "Choose the simplest sound solution",
    copy: "Improve a process, use an existing platform, connect systems, or plan a custom build.",
  },
  {
    number: "03",
    label: "Implement and improve",
    title: "Build, measure, and refine",
    copy: "Launch carefully, train the team, and assess improvement against agreed measures.",
  },
] as const;

export default function GrowthLifecycle() {
  return (
    <section
      id="growth-lifecycle"
      className="section-pad scroll-mt-24 overflow-hidden bg-charcoal text-ivory"
    >
      <div className="container-x">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <SectionHeading
            title="The solution follows the business problem"
            light
            copy="Good architecture begins with understanding the work. The right answer is sometimes a custom system and sometimes something simpler."
          />
          <Link
            href="/services/automation"
            className="inline-flex w-fit items-center gap-2 font-medium text-ivory underline decoration-brass underline-offset-4 hover:text-brass-light"
            data-analytics-event="Service Explored"
            data-analytics-location="homepage_growth_lifecycle"
            data-analytics-target="automation"
          >
            Explore custom systems <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <ol className="growth-lifecycle mt-12">
          {stages.map((stage) => (
            <li key={stage.number} className="growth-lifecycle__stage">
              <span className="growth-lifecycle__node" aria-hidden="true" />
              <span className="inline-flex border border-brass/40 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-brass-light md:hidden">
                {stage.label}
              </span>
              <span className="hidden font-serif text-lg italic text-brass-light md:inline">
                {stage.number}
              </span>
              <h3 className="mt-4 font-serif text-2xl text-ivory md:mt-5">
                {stage.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-ivory/65">
                {stage.copy}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
