"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, FolderOpen, LifeBuoy, UserRound } from "lucide-react";
import { Analytics } from "@vercel/analytics/next";
import AnalyticsClickTracker from "./AnalyticsClickTracker";
import Navbar from "./Navbar";
import WindowFrame from "./WindowFrame";
import { site } from "@/lib/site";

const workspacePaths = ["/portal", "/account", "/sign-in", "/sign-up"];

export default function ExperienceFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const workspace = workspacePaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!workspace) {
    return (
      <>
        <WindowFrame />
        <Navbar />
        <Analytics />
        <AnalyticsClickTracker />
        <div
          id="window-viewport"
          className="relative z-10 min-h-[100dvh] overflow-x-clip scroll-pt-28 scroll-smooth lg:fixed lg:bottom-4 lg:left-4 lg:right-4 lg:top-[3.75rem] lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden lg:rounded-b-2xl"
        >
          <main id="main-content">{children}</main>
        </div>
      </>
    );
  }

  const projectsActive =
    pathname === "/portal" || pathname.startsWith("/portal/");
  const accountActive =
    pathname === "/account" || pathname.startsWith("/account/");
  return (
    <div
      id="window-viewport"
      className="h-[100dvh] overflow-y-auto overscroll-contain bg-[#f7f6f2] text-[#233a30] lg:flex"
    >
      <aside
        className="sticky top-0 hidden h-[100dvh] w-[264px] shrink-0 flex-col bg-[#1e3029] px-6 py-8 text-[#f9f3ed] lg:flex xl:w-[288px]"
        aria-label="Workspace sidebar"
      >
        <Link
          href={site.url}
          aria-label="Pierce Business Integrations website"
          className="block"
        >
          <Image
            src="/logos/pbi-half-lockup-dark.png"
            alt="Pierce Business Integrations"
            width={5000}
            height={1742}
            priority
            className="h-auto w-[170px]"
          />
        </Link>
        <div className="mt-9 border-t border-white/15 pt-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d8a45b]">
            Client workspace
          </p>
          <p className="mt-2 font-serif text-[1.4rem] leading-tight">
            A clear view of what’s next.
          </p>
        </div>
        <nav aria-label="Workspace navigation" className="mt-12 space-y-1">
          <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Workspace
          </p>
          <Link
            href="/portal"
            aria-current={projectsActive ? "page" : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${projectsActive ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/10 hover:text-white"}`}
          >
            <FolderOpen
              size={18}
              aria-hidden="true"
              className={projectsActive ? "text-[#d8a45b]" : ""}
            />{" "}
            Projects
            {projectsActive && (
              <span
                className="ml-auto h-1.5 w-1.5 rounded-full bg-[#d8a45b]"
                aria-hidden="true"
              />
            )}
          </Link>
          <Link
            href="/account"
            aria-current={accountActive ? "page" : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${accountActive ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/10 hover:text-white"}`}
          >
            <UserRound
              size={18}
              aria-hidden="true"
              className={accountActive ? "text-[#d8a45b]" : ""}
            />{" "}
            Client home
            {accountActive && (
              <span
                className="ml-auto h-1.5 w-1.5 rounded-full bg-[#d8a45b]"
                aria-hidden="true"
              />
            )}
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
          <p className="mt-7 px-3 text-xs leading-5 text-white/40">
            Pierce Business Integrations
            <br />
            Pierce Business Group LLC
          </p>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
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
        <footer className="border-t border-[#233a30]/10 px-5 py-6 text-[#233a30]/60">
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
