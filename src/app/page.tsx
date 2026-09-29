import type { Metadata, Viewport } from "next";
import Hero from "@/components/Hero";
import HomeSections from "@/components/HomeSections";
import Footer from "@/components/Footer";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Business Systems & Integrations in North Georgia",
  "Pierce Business Integrations helps North Georgia businesses identify operational friction and implement practical solutions, from better workflows to custom systems, websites, and advertising.",
  "/",
);

export const viewport: Viewport = {
  themeColor: "#071117",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function Home() {
  return (
    <>
      <Hero />
      <HomeSections />
      <Footer />
    </>
  );
}
