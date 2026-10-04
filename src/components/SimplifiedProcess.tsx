import SectionHeading from "./SectionHeading";

const steps = [
  {
    number: "01",
    title: "Diagnose",
    copy: "Understand the workflow, constraint, cost, and desired outcome.",
  },
  {
    number: "02",
    title: "Architect & implement",
    copy: "Select the right approach, define scope, and deliver it carefully.",
  },
  {
    number: "03",
    title: "Measure & improve",
    copy: "Review agreed indicators and refine the solution as work changes.",
  },
] as const;

export default function SimplifiedProcess() {
  return (
    <section id="process" className="section-pad scroll-mt-24 bg-ivory">
      <div className="container-x">
        <SectionHeading
          title="From business diagnosis to measurable improvement"
          copy="The proposal defines the approach, work, investment, and realistic measures before implementation begins."
        />
        <ol className="simple-process mt-12">
          {steps.map((step) => (
            <li key={step.number} className="simple-process__step">
              <span className="simple-process__node" aria-hidden="true" />
              <span className="hidden font-serif text-xl italic text-foothill md:inline">
                {step.number}
              </span>
              <h3 className="font-serif text-2xl text-charcoal md:mt-4">
                {step.title}
              </h3>
              <p className="mt-3 max-w-sm text-charcoal-soft">{step.copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
