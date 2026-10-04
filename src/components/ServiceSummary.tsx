import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/lib/site";
import styles from "./Services.module.css";

export default function ServiceSummary({
  service,
  description,
}: {
  service: Service;
  description?: string;
}) {
  return (
    <article className={styles.summary}>
      <div>
        <h3>{service.shortTitle}</h3>
        <p>{description ?? service.description}</p>
      </div>
      <Link
        href={`/services/${service.slug}`}
        data-analytics-event="Service Explored"
        data-analytics-location="homepage_services"
        data-analytics-target={service.slug}
        className={styles.textLink}
        aria-label={`Explore ${service.shortTitle}`}
      >
        Explore service <ArrowUpRight size={17} aria-hidden="true" />
      </Link>
    </article>
  );
}
