import Image from "next/image";
import clsx from "clsx";
import styles from "./PageIllustration.module.css";

const illustrations = {
  planning: {
    src: "/illustrations/project-planning.svg",
    alt: "Project notes, a workflow sketch, and a pencil arranged for planning a solution.",
  },
  systems: {
    src: "/illustrations/connected-systems.svg",
    alt: "Business records moving through connected tools into one organized workflow.",
  },
  website: {
    src: "/illustrations/website-development.svg",
    alt: "A custom website layout taking shape across a desktop page and a mobile screen.",
  },
  care: {
    src: "/illustrations/website-care.svg",
    alt: "A website being maintained through careful updates, checks, and ongoing support.",
  },
  advertising: {
    src: "/illustrations/advertising.svg",
    alt: "An advertising message connecting with an audience and leading to a new inquiry.",
  },
} as const;

export type IllustrationTopic = keyof typeof illustrations;

export default function PageIllustration({
  topic,
  className,
}: {
  topic: IllustrationTopic;
  className?: string;
}) {
  const illustration = illustrations[topic];

  return (
    <figure className={clsx(styles.figure, className)}>
      <Image
        src={illustration.src}
        alt={illustration.alt}
        width={640}
        height={480}
        unoptimized
        className={styles.artwork}
      />
    </figure>
  );
}
