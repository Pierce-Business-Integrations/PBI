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
    const touchDevice = window.matchMedia("(hover: none), (pointer: coarse)");
    let stopTracking = () => {};

    function clearOffsets() {
      background!.style.removeProperty("--hero-background-offset");
      hero!.style.removeProperty("--hero-letter-travel");
    }

    function configureMotion() {
      stopTracking();
      clearOffsets();
      // Native touch scrolling stays free of per-frame geometry and letter updates.
      if (reducedMotion.matches || touchDevice.matches) return;

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
        if (visible && !document.hidden && frame === null) {
          frame = window.requestAnimationFrame(paint);
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
      intersectionObserver.observe(hero!);
      resizeObserver.observe(hero!);
      requestPaint();

      window.addEventListener("scroll", requestPaint, { passive: true });
      window.addEventListener("resize", requestPaint, { passive: true });
      document.addEventListener("visibilitychange", visibilityChanged);
      stopTracking = () => {
        cancelFrame();
        intersectionObserver.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener("scroll", requestPaint);
        window.removeEventListener("resize", requestPaint);
        document.removeEventListener("visibilitychange", visibilityChanged);
      };
    }

    configureMotion();
    reducedMotion.addEventListener("change", configureMotion);
    touchDevice.addEventListener("change", configureMotion);
    return () => {
      stopTracking();
      clearOffsets();
      reducedMotion.removeEventListener("change", configureMotion);
      touchDevice.removeEventListener("change", configureMotion);
    };
  }, []);

  return (
    <picture ref={picture} className={styles.heroBackground}>
      {children}
    </picture>
  );
}
