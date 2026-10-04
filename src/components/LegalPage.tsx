import PageHero from "./PageHero";
import Footer from "./Footer";
import styles from "./SiteDesign.module.css";

export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHero title={title} breadcrumbs={[{ label: title }]}>
        <span>Last updated {updated}</span>
      </PageHero>
      <section className={styles.section}>
        <div className={styles.container}>
          <article className={styles.legalCopy}>{children}</article>
        </div>
      </section>
      <Footer />
    </>
  );
}
