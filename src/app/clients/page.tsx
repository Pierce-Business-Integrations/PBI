import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, FolderOpen, ReceiptText } from "lucide-react";
import PageHero from "@/components/PageHero";
import Footer from "@/components/Footer";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Clients",
  "A private workspace for Pierce Business Integrations clients to review their projects, documents, agreements, and invoices.",
  "/clients",
);

const clientSignInHref =
  process.env.VERCEL_ENV === "production"
    ? "https://client.piercebusinessintegrations.com/sign-in"
    : "/sign-in";

export default function ClientsPage() {
  return (
    <>
      <PageHero
        eyebrow="For current clients"
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
      <section className="section-pad bg-ivory">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div className="max-w-xl">
            <p className="eyebrow">Client access</p>
            <h2 className="heading-serif mt-4 text-4xl text-charcoal sm:text-5xl">
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
                  <h3 className="font-serif text-2xl text-charcoal">{title}</h3>
                  <p className="mt-1 text-sm text-charcoal-soft">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-charcoal py-16 text-ivory">
        <div className="container-x flex flex-wrap items-center justify-between gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass-light">
              New to PBI?
            </p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
              Start with a conversation.
            </h2>
            <p className="mt-3 max-w-xl text-ivory/70">
              You do not need a client account to discuss a business problem or
              explore a project.
            </p>
          </div>
          <Link
            href="/contact"
            className="btn-outline-light inline-flex items-center gap-2"
          >
            Discuss a problem <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
