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
  "Business Systems & Integrations in North Georgia",
  "Pierce Business Integrations helps North Georgia businesses identify operational friction and implement practical solutions, from better workflows to custom systems, websites, and advertising.",
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
