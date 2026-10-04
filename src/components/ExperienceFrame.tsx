"use client";

import Image from "next/image";
import Script from "next/script";
import AttributionCapture from "./AttributionCapture";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowUpRight, FolderOpen, LifeBuoy, UserRound } from "lucide-react";
import { Analytics } from "@vercel/analytics/next";
import AnalyticsClickTracker from "./AnalyticsClickTracker";
import { site } from "@/lib/site";
import styles from "./Workspace.module.css";
import HomeNavigation from "./homepage/HomeNavigation";
import homepageStyles from "./homepage/Homepage.module.css";
import siteStyles from "./SiteDesign.module.css";

const workspacePaths = ["/portal", "/account", "/sign-in", "/sign-up", "/auth"];

export default function ExperienceFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    viewport.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  const workspace = workspacePaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!workspace) {
    return (
      <div className={`${homepageStyles.homeShell} ${siteStyles.siteShell}`}>
        <HomeNavigation />
        <AttributionCapture />
        <Script
          id="google-ads-tag-loader"
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-18304491645"
          strategy="lazyOnload"
        />
        <Script
          id="google-ads-tag-config"
          strategy="lazyOnload"
        >{`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'AW-18304491645');`}</Script>
        <Analytics />
        <AnalyticsClickTracker />
        <div id="window-viewport" className={homepageStyles.homeViewport}>
          <main id="main-content">{children}</main>
        </div>
      </div>
    );
  }

  const projectsActive =
    pathname === "/portal" || pathname.startsWith("/portal/");
  const accountActive =
    pathname === "/account" || pathname.startsWith("/account/");
  return (
    <div
      id="window-viewport"
      ref={viewport}
      className={`${styles.workspace} h-[100dvh] overflow-y-auto overscroll-contain bg-[#f5f6f4] text-[#233a30] lg:flex`}
    >
      <aside
        className="sticky top-0 hidden h-[100dvh] w-[224px] shrink-0 flex-col border-r border-white/10 bg-[#1e3029] px-4 py-6 text-[#f9f3ed] lg:flex"
        aria-label="Workspace sidebar"
      >
        <Link
          href={site.url}
          aria-label="Pierce Business Integrations website"
          className="block px-3"
        >
          <Image
            src="/logos/pbi-half-lockup-dark.png"
            alt="Pierce Business Integrations"
            width={5000}
            height={1742}
            priority
            className="h-auto w-[150px]"
          />
        </Link>
        <div className="mt-7 border-t border-white/10 px-3 pt-5">
          <p className="text-xs font-medium text-white/65">Client portal</p>
        </div>
        <nav aria-label="Workspace navigation" className="mt-5 space-y-1">
          <Link
            href="/portal"
            aria-current={projectsActive ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${projectsActive ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
          >
            <FolderOpen size={18} aria-hidden="true" /> Projects
          </Link>
          <Link
            href="/account"
            aria-current={accountActive ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${accountActive ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
          >
            <UserRound size={18} aria-hidden="true" /> Client home
          </Link>
        </nav>
        <div className="mt-auto border-t border-white/15 pt-6">
          <Link
            href="/contact"
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            <LifeBuoy size={18} aria-hidden="true" /> Get support
          </Link>
          <Link
            href={site.url}
            className="mt-1 flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ArrowUpRight size={18} aria-hidden="true" /> Visit website
          </Link>
          <p className="mt-6 px-3 text-[11px] leading-5 text-white/60">
            Pierce Business Integrations
            <br />
            Pierce Business Group LLC
          </p>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="hidden h-16 items-center justify-between border-b border-[#233a30]/10 bg-white px-8 text-xs lg:flex xl:px-10">
          <p className="flex items-center gap-3 text-[#233a30]/65">
            <span className="font-medium text-[#233a30]">Client portal</span>
            <span aria-hidden="true">/</span>
            {projectsActive
              ? "Projects"
              : accountActive
                ? "Client home"
                : "Sign in"}
          </p>
          <Link
            href="/contact"
            className="inline-flex min-h-10 items-center gap-2 font-medium hover:text-[#567d50]"
          >
            <LifeBuoy size={15} aria-hidden="true" /> Contact PBI
          </Link>
        </div>
        <header className="sticky top-0 z-50 border-b border-[#233a30]/10 bg-[#f7f6f2]/95 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex h-[72px] w-[min(100%-2.5rem,1280px)] items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4 sm:gap-6">
              <Link
                href={site.url}
                aria-label="Pierce Business Integrations website"
                className="shrink-0"
              >
                <Image
                  src="/logos/pbi-half-lockup.png"
                  alt="Pierce Business Integrations"
                  width={5000}
                  height={1742}
                  priority
                  className="h-9 w-auto sm:h-10"
                />
              </Link>
              <span
                className="hidden h-7 w-px bg-[#d8a45b]/65 sm:block"
                aria-hidden="true"
              />
              <span className="hidden truncate text-xs font-semibold uppercase tracking-[0.16em] text-[#233a30]/65 sm:block">
                Client workspace
              </span>
            </div>
            <nav
              className="flex items-center gap-1 sm:gap-2"
              aria-label="Workspace navigation"
            >
              <Link
                href="/portal"
                aria-label="Projects"
                aria-current={projectsActive ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium transition sm:px-4 ${projectsActive ? "bg-[#233a30] text-white" : "text-[#233a30]/75 hover:bg-[#233a30]/5 hover:text-[#233a30]"}`}
              >
                <FolderOpen size={17} aria-hidden="true" />
                <span className="hidden min-[360px]:inline">Projects</span>
              </Link>
              <Link
                href="/account"
                aria-label="Client home"
                aria-current={accountActive ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium transition sm:px-4 ${accountActive ? "bg-[#233a30] text-white" : "text-[#233a30]/75 hover:bg-[#233a30]/5 hover:text-[#233a30]"}`}
              >
                <UserRound size={17} aria-hidden="true" />
                <span className="hidden min-[360px]:inline">Home</span>
              </Link>
              <Link
                href="/contact"
                className="ml-1 hidden min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-[#233a30]/75 transition hover:bg-[#233a30]/5 hover:text-[#233a30] md:inline-flex"
              >
                <LifeBuoy size={17} aria-hidden="true" /> Help
              </Link>
            </nav>
          </div>
        </header>
        <main
          id="main-content"
          className="min-h-[calc(100dvh-72px)] lg:min-h-[100dvh]"
        >
          {children}
        </main>
        <footer className="border-t border-[#233a30]/10 px-5 py-5 text-[#233a30]/70 lg:px-8 xl:px-10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-xs">
            <span>
              Pierce Business Integrations · Pierce Business Group LLC
            </span>
            <Link
              href={site.url}
              className="inline-flex items-center gap-1 font-medium hover:text-[#233a30]"
            >
              Visit the website <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
