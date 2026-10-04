import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { site } from "@/lib/site";
import styles from "./homepage/Homepage.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        <div className={styles.footerMain}>
          <div className={styles.footerBrand}>
            <Link href="/" aria-label="Pierce Business Integrations home">
              <Image
                src="/logos/pbi-half-lockup.png"
                alt=""
                width={5000}
                height={1742}
                sizes="220px"
              />
            </Link>
            <p>Modern solutions. Local partnership.</p>
            <p className={styles.footerLocation}>
              Based in North Georgia. Serving Gwinnett, Hall, Barrow, Forsyth,
              and surrounding communities.
            </p>
          </div>
          <nav className={styles.footerLinks} aria-label="Footer navigation">
            <p>Explore</p>
            <Link href="/services">Solutions</Link>
            <Link href="/services/automation">Business systems</Link>
            <Link href="/how-we-work">How We Work</Link>
            <Link href="/about">About PBI</Link>
            <Link href="/contact">Contact</Link>
            {site.clientPortalPublic && <Link href="/clients">Clients</Link>}
          </nav>
          <nav className={styles.footerLinks} aria-label="Footer services">
            <p>Also here to help</p>
            <Link href="/services/web-design">Websites</Link>
            <Link href="/services/website-care">Website care</Link>
            <Link href="/services/advertising">Advertising</Link>
            {site.email && <a href={"mailto:" + site.email}>{site.email}</a>}
          </nav>
        </div>
        <div className={styles.footerLegal}>
          <p>
            © {new Date().getFullYear()} Pierce Business Integrations. A brand
            of Pierce Business Group LLC.
          </p>
          <div>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href="#top">
              Back to top <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
