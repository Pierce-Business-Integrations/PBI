import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./homepage/Homepage.module.css";

export default function CTASection({
  title = "Let’s build something useful for your business.",
  copy = "Start with a practical conversation about where you are, what is getting in the way, and what the right next step could look like.",
  buttonLabel = "Discuss your project",
}: {
  title?: string;
  copy?: string;
  buttonLabel?: string;
}) {
  return (
    <section className={styles.contactSection}>
      <div className={styles.container}>
        <h2 className={styles.contactHeading}>{title}</h2>
        <div className={styles.contactActions}>
          <p>{copy}</p>
          <Link
            href="/contact"
            className={styles.primaryButton}
            data-analytics-event="Consultation CTA Clicked"
            data-analytics-location="section_cta"
            data-analytics-target="contact"
          >
            {buttonLabel} <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
