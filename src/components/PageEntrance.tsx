"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAnimate } from "motion/react-mini";

export default function PageEntrance({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const [scope, animate] = useAnimate<HTMLDivElement>();

  useLayoutEffect(() => {
    const element = scope.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // HTML stays visible without JavaScript. Section links should arrive undisturbed.
    if (!element || reducedMotion.matches || window.location.hash) return;

    const animation = animate(
      element,
      { opacity: [0, 1], transform: ["translateY(12px)", "translateY(0px)"] },
      { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
    );
    const preferenceChanged = () => {
      if (reducedMotion.matches) animation.cancel();
    };
    reducedMotion.addEventListener("change", preferenceChanged);

    return () => {
      animation.cancel();
      reducedMotion.removeEventListener("change", preferenceChanged);
    };
  }, [pathname, animate, scope]);

  return (
    <div ref={scope} className={className} data-page-entrance>
      {children}
    </div>
  );
}
