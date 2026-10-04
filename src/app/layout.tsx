import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import ExperienceFrame from "@/components/ExperienceFrame";
import { site } from "@/lib/site";

const isPreview = process.env.VERCEL_ENV === "preview";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f9f3ed",
  colorScheme: "light",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default:
      "Pierce Business Integrations | Modern solutions. Local partnership.",
    template: "%s | Pierce Business Integrations",
  },
  description: site.description,
  applicationName: site.name,
  // Preview deployments should point at the production canonical without being indexed.
  robots: {
    index: !isPreview,
    follow: !isPreview,
    googleBot: {
      index: !isPreview,
      follow: !isPreview,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      legalName: "Pierce Business Group LLC",
      url: site.url,
      description: site.description,
      ...(site.email ? { email: site.email } : {}),
      logo: {
        "@type": "ImageObject",
        url: `${site.url}/logos/pbi-icon-color.png`,
      },
      areaServed: [
        "North Georgia",
        "Gwinnett County, Georgia",
        "Hall County, Georgia",
        "Barrow County, Georgia",
        "Forsyth County, Georgia",
      ],
      ...(site.email
        ? {
            contactPoint: {
              "@type": "ContactPoint",
              email: site.email,
              contactType: "sales and customer support",
              availableLanguage: "English",
            },
          }
        : {}),
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description: site.description,
      publisher: { "@id": `${site.url}/#organization` },
      inLanguage: "en-US",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-ivory font-sans text-charcoal antialiased">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ExperienceFrame>{children}</ExperienceFrame>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
