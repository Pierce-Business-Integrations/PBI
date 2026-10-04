"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Menu, UserRound, X } from "lucide-react";
import clsx from "clsx";
import { site } from "@/lib/site";
import styles from "./Homepage.module.css";

const links = [
  { label: "Solutions", href: "/services" },
  { label: "Business systems", href: "/services/automation" },
  { label: "How We Work", href: "/how-we-work" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function HomeNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [entryOffset, setEntryOffset] = useState(0);
  const navigation = useRef<HTMLElement>(null);
  const floating = useRef(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);

  useEffect(() => {
    const update = () => {
      const next = floating.current ? window.scrollY > 0 : window.scrollY > 24;
      if (next === floating.current) return;

      if (next) {
        const bounds = navigation.current?.getBoundingClientRect();
        // Start where the visible header is, rather than resetting it offscreen.
        setEntryOffset(
          Math.max(-(bounds?.height ?? 96), Math.min(bounds?.top ?? 0, 0)),
        );
      }

      floating.current = next;
      setScrolled(next);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);

  const active = (href: string) =>
    pathname === href ||
    (href === "/services" &&
      pathname.startsWith("/services/") &&
      pathname !== "/services/automation");

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (
        !menu.current?.contains(event.target as Node) &&
        !toggle.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    const query = window.matchMedia("(min-width: 1101px)");
    const resize = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
      query.removeEventListener("change", resize);
    };
  }, [open]);

  return (
    <header
      ref={navigation}
      style={
        { "--navigation-entry-offset": `${entryOffset}px` } as CSSProperties
      }
      className={clsx(
        styles.navigation,
        (scrolled || open) && styles.navigationSolid,
        scrolled && styles.navigationScrolled,
      )}
    >
      <div className={styles.navigationInner}>
        <Link
          href="/"
          className={styles.logo}
          aria-label="Pierce Business Integrations home"
        >
          <Image
            src="/logos/pbi-half-lockup.png"
            alt=""
            width={5000}
            height={1742}
            sizes="180px"
            loading="eager"
          />
        </Link>
        <nav className={styles.desktopLinks} aria-label="Primary navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active(link.href) ? "page" : undefined}
              {...(link.href === "/contact"
                ? {
                    "data-analytics-event": "Consultation CTA Clicked",
                    "data-analytics-location": "desktop_nav",
                    "data-analytics-target": "contact",
                  }
                : {})}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={styles.navigationActions}>
          {site.clientPortalPublic && (
            <Link
              href="/clients"
              className={styles.clientLink}
              aria-current={pathname === "/clients" ? "page" : undefined}
            >
              <UserRound size={16} aria-hidden="true" />
              Clients
            </Link>
          )}
          <button
            ref={toggle}
            type="button"
            className={styles.menuToggle}
            aria-expanded={open}
            aria-controls="home-mobile-navigation"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <X size={23} aria-hidden="true" />
            ) : (
              <Menu size={23} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <nav
        id="home-mobile-navigation"
        ref={menu}
        className={styles.mobileLinks}
        aria-label="Mobile navigation"
        hidden={!open}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active(link.href) ? "page" : undefined}
            onClick={() => setOpen(false)}
            {...(link.href === "/contact"
              ? {
                  "data-analytics-event": "Consultation CTA Clicked",
                  "data-analytics-location": "mobile_nav",
                  "data-analytics-target": "contact",
                }
              : {})}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
