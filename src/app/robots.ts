import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { site } from "@/lib/site";
import { isPrivateSearchHost } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");
  if (process.env.VERCEL_ENV === "preview" || isPrivateSearchHost(host)) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/project-intake",
        "/portal",
        "/account",
        "/sign-in",
        "/sign-up",
        "/auth",
      ],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
