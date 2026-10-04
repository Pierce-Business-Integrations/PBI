"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, UserRound, X } from "lucide-react";
import clsx from "clsx";
import Brand from "./Brand";
import { site } from "@/lib/site";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Solutions" },
  { href: "/services/automation", label: "Business Systems" },
  { href: "/how-we-work", label: "How We Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  ...(site.clientPortalPublic ? [{ href: "/clients", label: "Clients" }] : []),
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = document.getElementById("window-viewport");
    if (!el) return;
    const onScroll = () => {
      const documentScroll = Math.max(
        window.scrollY,
        document.scrollingElement?.scrollTop ?? 0,
        document.documentElement.scrollTop,
        document.body.scrollTop,
      );
      setScrolled(
        (window.innerWidth < 1024 ? documentScroll : el.scrollTop) > 24,
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.visualViewport?.addEventListener("scroll", onScroll, {
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", onScroll, {
      passive: true,
    });
    document.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.visualViewport?.removeEventListener("scroll", onScroll);
      window.visualViewport?.removeEventListener("resize", onScroll);
      document.removeEventListener("scroll", onScroll, true);
      el.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) =>
      event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const active = (href: string) =>
    pathname === href ||
    (href === "/clients" &&
      (pathname.startsWith("/account") ||
        pathname.startsWith("/sign-in") ||
        pathname.startsWith("/sign-up"))) ||
    (href === "/services" &&
      pathname.startsWith("/services/") &&
      pathname !== "/services/automation");
  const hasDarkHero = pathname === "/" || pathname === "/project-intake";
  const lightAtTop = hasDarkHero && !scrolled && !open;

  return (
    <header
      className={clsx(
        "pointer-events-auto fixed left-0 right-0 top-0 z-50 border-b transition-[padding,background-color,border-color,backdrop-filter] duration-300 lg:left-4 lg:right-4 lg:top-[3.75rem]",
        scrolled || open
          ? "border-charcoal/10 bg-ivory/90 py-1.5 backdrop-blur-md"
          : "border-transparent bg-transparent py-3 backdrop-blur-none",
      )}
    >
      <div
        className="h-[env(safe-area-inset-top)] lg:hidden"
        aria-hidden="true"
      />
      <div className="container-x flex items-center justify-between">
        <Brand light={lightAtTop} compact={scrolled || open} />
        <nav
          className="hidden items-center gap-4 xl:gap-7 lg:flex"
          aria-label="Primary navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={active(link.href) ? "page" : undefined}
              className={clsx(
                "relative inline-flex items-center gap-1.5 py-2 text-[0.82rem] tracking-wide transition-colors xl:text-[0.88rem]",
                lightAtTop
                  ? active(link.href)
                    ? "text-ivory after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-brass"
                    : "text-ivory/75 hover:text-ivory"
                  : active(link.href)
                    ? "text-foothill-deep after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-foothill"
                    : "text-charcoal-soft hover:text-charcoal",
              )}
            >
              {link.href === "/clients" && (
                <UserRound size={16} aria-hidden="true" />
              )}
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className={clsx(
              "px-5 py-2 text-[0.82rem]",
              lightAtTop
                ? "btn-outline-light border-brass/70 text-brass-light hover:bg-brass/10"
                : "btn-outline",
            )}
            data-analytics-event="Consultation CTA Clicked"
            data-analytics-location="desktop_nav"
            data-analytics-target="contact"
          >
            Discuss a Problem
          </Link>
        </nav>
        <button
          ref={closeRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={clsx(
            "pointer-events-auto relative z-10 touch-manipulation rounded-md p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass lg:hidden",
            lightAtTop ? "text-ivory" : "text-charcoal",
          )}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        >
          {open ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>
      <nav
        id="mobile-menu"
        aria-label="Mobile navigation"
        aria-hidden={!open}
        inert={!open}
        className={clsx(
          "grid overflow-hidden bg-ivory transition-[grid-template-rows,opacity,border-color] duration-300 ease-out motion-reduce:transition-none lg:hidden",
          open
            ? "grid-rows-[1fr] border-t border-charcoal/10 opacity-100"
            : "pointer-events-none grid-rows-[0fr] border-t border-transparent opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={clsx(
              "container-x flex flex-col py-5 transition-transform duration-300 ease-out motion-reduce:transition-none",
              open ? "translate-y-0" : "-translate-y-3",
            )}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={active(link.href) ? "page" : undefined}
                className={clsx(
                  "border-b border-charcoal/10 py-4 text-lg",
                  active(link.href) ? "text-foothill-deep" : "text-charcoal",
                )}
              >
                {link.href === "/clients" && (
                  <UserRound
                    size={20}
                    aria-hidden="true"
                    className="mr-2 inline"
                  />
                )}
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="btn-brass mt-5 w-fit"
              data-analytics-event="Consultation CTA Clicked"
              data-analytics-location="mobile_nav"
              data-analytics-target="contact"
            >
              Discuss a Problem
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
