import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, FolderOpen, ReceiptText } from "lucide-react";
import PageHero from "@/components/PageHero";
import Footer from "@/components/Footer";
import styles from "@/components/SiteDesign.module.css";
import { pageMetadata, site } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata(
    "Clients",
    "A private workspace for Pierce Business Integrations clients to review their projects, documents, agreements, and invoices.",
    "/clients",
  ),
  ...(!site.clientPortalPublic
    ? { robots: { index: false, follow: false } }
    : {}),
};

const clientSignInHref =
  process.env.VERCEL_ENV === "production"
    ? "https://client.piercebusinessintegrations.com/sign-in"
    : "/sign-in";

export default function ClientsPage() {
  return (
    <>
      <PageHero
        title={
          <>
            Your work,{" "}
            <span className="italic text-foothill">in one place.</span>
          </>
        }
      >
        <p>
          The PBI client workspace keeps active projects, important documents,
          agreements, and invoices together so you can see what needs your
          attention.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link
            href={clientSignInHref}
            className="btn-brass inline-flex items-center gap-2"
          >
            Client sign in <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium underline underline-offset-4"
          >
            Need access?
          </Link>
        </div>
      </PageHero>
      <section className={styles.section}>
        <div className={`${styles.container} ${styles.split}`}>
          <div className="max-w-xl">
            <h2 className={styles.sectionHeading}>
              Built for the work we’re doing together.
            </h2>
            <p className="mt-6 text-charcoal-soft">
              This workspace is for active PBI clients and authorized team
              members. PBI provides access when a project is set up; there is no
              public account registration.
            </p>
            <p className="mt-5 text-sm text-charcoal-soft">
              Already a client but need access?{" "}
              <Link
                href="/contact"
                className="font-medium underline underline-offset-4"
              >
                Contact PBI
              </Link>
              .
            </p>
          </div>
          <div className="border-y border-charcoal/15">
            {[
              {
                icon: FolderOpen,
                title: "Projects",
                description: "See the work connected to your business.",
              },
              {
                icon: FileText,
                title: "Documents & agreements",
                description:
                  "Review available proposals, agreements, and completed files.",
              },
              {
                icon: ReceiptText,
                title: "Invoices",
                description:
                  "Find invoices and available payment actions in one place.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex gap-5 border-b border-charcoal/15 py-6 last:border-b-0"
              >
                <Icon
                  size={24}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-foothill"
                />
                <div>
                  <h3 className="text-2xl font-medium tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-charcoal-soft">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className={`${styles.section} ${styles.sectionAlternate}`}>
        <div
          className={`${styles.container} flex flex-wrap items-center justify-between gap-8`}
        >
          <div>
            <h2 className={styles.smallHeading}>Start with a conversation.</h2>
            <p className={`${styles.bodyCopy} mt-4 max-w-xl`}>
              You do not need a client account to discuss a business problem or
              explore a project.
            </p>
          </div>
          <Link
            href="/contact"
            className="btn-outline inline-flex items-center gap-2"
          >
            Discuss a problem <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
