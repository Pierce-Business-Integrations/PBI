import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ConsultationForm from "@/components/ConsultationForm";
import Footer from "@/components/Footer";
import { pageMetadata, site } from "@/lib/site";
import styles from "@/components/SiteDesign.module.css";

export const metadata: Metadata = pageMetadata(
  "Discuss a Business Problem or Project",
  "Tell Pierce Business Integrations about an operational bottleneck, custom-system need, website, website care, or advertising project in North Georgia.",
  "/contact",
);

export default function ContactPage() {
  return (
    <>
      <PageHero
        title={
          <>
            Tell us where your business
            <br />
            <span className="italic text-foothill">gets stuck.</span>
          </>
        }
      >
        Describe the friction or outcome you have in mind. You do not need to
        know which technology will solve it. Website and advertising inquiries
        are welcome too. You will typically receive an initial response within
        one business day.
      </PageHero>
      <section className={styles.section}>
        <div
          className={`${styles.container} grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20`}
        >
          <aside>
            <h2 className={styles.smallHeading}>
              Start with a straightforward conversation.
            </h2>
            <dl className="mt-8 divide-y divide-charcoal/15 border-y border-charcoal/15">
              {site.email && (
                <div className="py-5">
                  <dt className="text-xs uppercase tracking-[0.14em] text-taupe">
                    Email
                  </dt>
                  <dd className="mt-2">
                    <a
                      className="text-charcoal underline decoration-foothill underline-offset-4"
                      href={`mailto:${site.email}`}
                    >
                      {site.email}
                    </a>
                  </dd>
                </div>
              )}
              <div className="py-5">
                <dt className="text-xs uppercase tracking-[0.14em] text-taupe">
                  Service area
                </dt>
                <dd className="mt-2 text-charcoal-soft">{site.area}</dd>
              </div>
            </dl>
          </aside>
          <div className={styles.formSurface}>
            <ConsultationForm />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
