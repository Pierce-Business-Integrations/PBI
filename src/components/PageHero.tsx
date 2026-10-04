import { Children, isValidElement, type ReactNode } from "react";
import Image from "next/image";
import Breadcrumbs from "./Breadcrumbs";
import HeroBackground from "./homepage/HeroBackground";
import HeroHeadline from "./homepage/HeroHeadline";
import PageEntrance from "./PageEntrance";
import homepageStyles from "./homepage/Homepage.module.css";
import styles from "./SiteDesign.module.css";

function titleText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number")
        return String(child);
      if (!isValidElement<{ children?: ReactNode }>(child)) return "";
      return child.type === "br" ? "\n" : titleText(child.props.children);
    })
    .join("");
}

export default function PageHero({
  title,
  children,
  breadcrumbs,
}: {
  title: ReactNode;
  children: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  return (
    <section
      id="top"
      className={styles.pageHero}
      aria-labelledby="page-heading"
    >
      <HeroBackground>
        <source
          media="(max-width: 767px)"
          srcSet="/images/homepage/pbi-gradient-mobile.webp"
        />
        <Image
          src="/images/homepage/pbi-gradient.webp"
          alt=""
          fill
          unoptimized
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className={homepageStyles.gradient}
        />
      </HeroBackground>
      <div className={styles.heroFade} aria-hidden="true" />
      <PageEntrance className={styles.container}>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <HeroHeadline
          id="page-heading"
          className={styles.pageHeroHeading}
          lines={titleText(title).split("\n").filter(Boolean)}
        />
        <div className={styles.heroCopy}>{children}</div>
      </PageEntrance>
    </section>
  );
}
