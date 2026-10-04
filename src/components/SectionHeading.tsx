import clsx from "clsx";
import styles from "./SiteDesign.module.css";

export default function SectionHeading({
  title,
  copy,
  center = false,
  light = false,
}: {
  title: React.ReactNode;
  copy?: React.ReactNode;
  center?: boolean;
  light?: boolean;
}) {
  return (
    <div
      className={clsx(
        styles.headingBlock,
        center && styles.headingCentered,
        light && styles.light,
      )}
    >
      <h2 className={styles.sectionHeading}>{title}</h2>
      {copy && <div className={styles.sectionCopy}>{copy}</div>}
    </div>
  );
}
