import Link from "next/link";
import Brand from "./Brand";
import { featuredServices, site } from "@/lib/site";
import { GeorgiaSeal } from "./GeorgiaServiceAreaMap";

export default function Footer() {
  return (
    <footer className="border-t-4 border-foothill bg-charcoal py-16 text-ivory/70">
      <div className="container-x grid gap-12 border-b border-ivory/15 pb-12 md:grid-cols-[1.3fr_0.7fr_1fr]">
        <div>
          <Brand light />
          <p className="mt-6 max-w-md">
            Modern solutions. Local partnership. Practical systems, websites,
            advertising, and direct support across North Georgia.
          </p>
          <div className="mt-6 flex max-w-md items-center gap-4 border-t border-ivory/15 pt-5">
            <GeorgiaSeal className="h-14 w-14 shrink-0 text-brass-light" />
            <div>
              <p className="text-xs leading-relaxed text-ivory/60">
                <span className="font-semibold uppercase tracking-[0.14em] text-ivory/80">
                  Based in North Georgia
                </span>
                <span className="mx-2 text-brass-light">·</span>
                Serving Gwinnett, Hall, Barrow, Forsyth, and surrounding
                communities
              </p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foothill-light">
            Navigate
          </h2>
          <nav className="mt-5 grid gap-3" aria-label="Footer navigation">
            <Link href="/services">Solutions</Link>
            <Link href="/services/automation">Business Systems</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/clients">Clients</Link>
          </nav>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foothill-light">
            Services
          </h2>
          <div className="mt-5 grid gap-3">
            {featuredServices.map((service) => (
              <Link key={service.slug} href={`/services/${service.slug}`}>
                {service.shortTitle}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="container-x flex flex-col gap-4 pt-8 text-sm text-ivory/50 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} Pierce Business Integrations. All rights
          reserved. A brand of Pierce Business Group LLC.
        </p>
        <div className="flex flex-wrap gap-5">
          {site.email && <a href={`mailto:${site.email}`}>{site.email}</a>}
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
