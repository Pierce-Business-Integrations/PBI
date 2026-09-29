import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import ProjectIntakeForm from "@/components/ProjectIntakeForm";
import { INTAKE_COOKIE_NAME, intakeSessionIsValid } from "@/lib/intake-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Private Project Intake",
  description:
    "Private project intake for invited Pierce Business Integrations clients and prospects.",
  referrer: "no-referrer",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ProjectIntakePage() {
  const cookieStore = await cookies();
  if (!intakeSessionIsValid(cookieStore.get(INTAKE_COOKIE_NAME)?.value))
    notFound();

  return (
    <>
      <section className="bg-charcoal px-6 pb-16 pt-24 text-ivory sm:px-10 lg:pb-20 lg:pt-28">
        <div className="container-x">
          <p className="eyebrow text-foothill-light">
            Private / Project Discovery
          </p>
          <h1 className="heading-serif mt-6 max-w-4xl text-4xl sm:text-5xl lg:text-6xl">
            Tell me how your business works.
            <br />
            <span className="italic text-foothill-light">
              We’ll plan what it needs next.
            </span>
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-ivory/75 sm:text-lg">
            This intake helps me understand the problem, existing tools, people
            involved, and the outcome you want. It supports custom systems,
            websites, care, advertising, integrations, and simpler process
            improvements. Answer what you know; “not sure yet” is useful
            information too.
          </p>
          <p className="mt-5 text-sm text-ivory/60">
            Please do not include passwords, account credentials, payment
            details, or sensitive customer data. We can arrange a safer way to
            share those later.
          </p>
        </div>
      </section>
      <section className="section-pad bg-ivory-deep">
        <div className="container-x max-w-5xl">
          <ProjectIntakeForm />
        </div>
      </section>
      <Footer />
    </>
  );
}
