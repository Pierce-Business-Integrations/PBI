import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import PageHero from "@/components/PageHero";
import Footer from "@/components/Footer";
import ThankYouConversion from "@/components/ThankYouConversion";
import { pageMetadata, site } from "@/lib/site";
import styles from "@/components/SiteDesign.module.css";

export const metadata: Metadata = {
  ...pageMetadata(
    "Thank You",
    "Your consultation inquiry has been received by Pierce Business Integrations.",
    "/thank-you",
  ),
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <>
      <ThankYouConversion />
      <PageHero
        title={
          <>
            Thank You.
            <br />
            <span className="italic text-foothill">
              Your Inquiry Is On Its Way.
            </span>
          </>
        }
      >
        I’ve received your information and will review it personally. You can
        expect a response within one business day.
      </PageHero>
      <section className={styles.section}>
        <div
          className={`${styles.container} grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end`}
        >
          <div>
            <h2 className={styles.smallHeading}>
              No further action is required.
            </h2>
            <p className="mt-5 max-w-2xl text-charcoal-soft">
              I’ll review the details you shared and follow up directly. If you
              need to add something in the meantime, you’re welcome to email me.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <Link href="/" className="btn-outline">
              Return Home
            </Link>
            <Link href="/services" className="btn-outline">
              Review Services <ArrowRight size={17} />
            </Link>
            <a href={`mailto:${site.email}`} className="btn-brass">
              <Mail size={17} />
              Email Jacob
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
