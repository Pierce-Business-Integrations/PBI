"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Homepage.module.css";

const PARALLAX_RATIO = 0.35;

export default function HeroBackground({ children }: { children: ReactNode }) {
  const picture = useRef<HTMLPictureElement>(null);

  useEffect(() => {
    const background = picture.current;
    const hero = background?.closest("section");
    if (!background || !hero) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let frame: number | null = null;

    function cancelFrame() {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
    }

    function paint() {
      frame = null;
      const { top, height } = hero!.getBoundingClientRect();
      // Keep the background slower and the headline's individual offsets small.
      const distance = Math.max(0, Math.min(-top, height));
      background!.style.setProperty(
        "--hero-background-offset",
        `${(distance * PARALLAX_RATIO).toFixed(2)}px`,
      );
      hero!.style.setProperty(
        "--hero-letter-travel",
        `${(12 * Math.tanh(distance / 180)).toFixed(3)}px`,
      );
    }

    function requestPaint() {
      if (
        visible &&
        !document.hidden &&
        !reducedMotion.matches &&
        frame === null
      ) {
        frame = window.requestAnimationFrame(paint);
      }
    }

    function motionChanged() {
      cancelFrame();
      if (reducedMotion.matches) {
        background!.style.removeProperty("--hero-background-offset");
        hero!.style.removeProperty("--hero-letter-travel");
      } else {
        requestPaint();
      }
    }

    function visibilityChanged() {
      if (document.hidden) cancelFrame();
      else requestPaint();
    }

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) requestPaint();
      else cancelFrame();
    });
    const resizeObserver = new ResizeObserver(requestPaint);
    intersectionObserver.observe(hero);
    resizeObserver.observe(hero);
    requestPaint();

    window.addEventListener("scroll", requestPaint, { passive: true });
    window.addEventListener("resize", requestPaint, { passive: true });
    document.addEventListener("visibilitychange", visibilityChanged);
    reducedMotion.addEventListener("change", motionChanged);

    return () => {
      cancelFrame();
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", requestPaint);
      window.removeEventListener("resize", requestPaint);
      document.removeEventListener("visibilitychange", visibilityChanged);
      reducedMotion.removeEventListener("change", motionChanged);
      background.style.removeProperty("--hero-background-offset");
      hero.style.removeProperty("--hero-letter-travel");
    };
  }, []);

  return (
    <picture ref={picture} className={styles.heroBackground}>
      {children}
    </picture>
  );
}
