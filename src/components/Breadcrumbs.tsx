import { site } from "@/lib/site";

export default function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  const schemaItems = [
    { label: "Home", href: "/" },
    ...items.filter((item): item is { label: string; href: string } =>
      Boolean(item.href),
    ),
  ];
  const hasCurrentUrl = Boolean(items.at(-1)?.href);
  if (!hasCurrentUrl) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: schemaItems.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            item: new URL(item.href, site.url).toString(),
          })),
        }).replace(/</g, "\\u003c"),
      }}
    />
  );
}
