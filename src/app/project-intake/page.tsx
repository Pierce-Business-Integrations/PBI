import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import ProjectIntakeForm from "@/components/ProjectIntakeForm";
import PageHero from "@/components/PageHero";
import styles from "@/components/SiteDesign.module.css";
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
      <PageHero
        title={
          <>
            Tell me how your business works.
            <br />
            We’ll plan what it needs next.
          </>
        }
      >
        <p>
          This intake helps me understand the problem, existing tools, people
          involved, and the outcome you want. It supports custom systems,
          websites, care, advertising, integrations, and simpler process
          improvements. Answer what you know; “not sure yet” is useful
          information too.
        </p>
        <p className="mt-5 text-sm">
          Please do not include passwords, account credentials, payment details,
          or sensitive customer data. We can arrange a safer way to share those
          later.
        </p>
      </PageHero>
      <section className={styles.section}>
        <div className={`${styles.container} ${styles.formSurface}`}>
          <ProjectIntakeForm />
        </div>
      </section>
      <Footer />
    </>
  );
}
