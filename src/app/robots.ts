import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview") {
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
      ],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
