import type { MetadataRoute } from "next";
import { featuredServices, site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/services",
    ...featuredServices.map((service) => `/services/${service.slug}`),
    "/how-we-work",
    "/about",
    "/contact",
    ...(site.clientPortalPublic ? ["/clients"] : []),
    "/privacy",
    "/terms",
  ];
  return paths.map((path) => ({
    url: `${site.url}${path}`,
    lastModified: new Date(`${site.contentUpdatedAt}T00:00:00.000Z`),
  }));
}
