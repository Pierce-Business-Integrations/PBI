import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import clsx from "clsx";
import HomePage from "@/components/homepage/HomePage";
import styles from "@/components/homepage/Homepage.module.css";
import { pageMetadata } from "@/lib/site";

const homepageFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-homepage",
  display: "swap",
});

export const metadata: Metadata = pageMetadata(
  "Custom Software & Business Integrations | Pierce Business Integrations",
  "Family-owned in North Georgia, PBI builds custom software, connects business tools, and applies practical AI to help your team work with less friction.",
  "/",
);

export const viewport: Viewport = {
  themeColor: "#f9f3ed",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function Home() {
  return <HomePage className={clsx(styles.page, homepageFont.variable)} />;
}
