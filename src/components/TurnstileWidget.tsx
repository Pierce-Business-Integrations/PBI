"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export default function TurnstileWidget({
  siteKey,
  resetKey,
  onToken,
}: {
  siteKey?: string;
  resetKey: number;
  onToken: (token: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onToken);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(
    () => typeof window !== "undefined" && Boolean(window.turnstile),
  );
  useEffect(() => {
    callbackRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!loaded || !siteKey || !containerRef.current || !window.turnstile)
      return;
    const widgetId = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "light",
      appearance: "interaction-only",
      callback: (token: string) => {
        setFailed(false);
        callbackRef.current(token);
      },
      "expired-callback": () => callbackRef.current(""),
      "error-callback": () => {
        setFailed(true);
        callbackRef.current("");
      },
    });
    return () => window.turnstile?.remove(widgetId);
  }, [loaded, resetKey, siteKey]);

  if (!siteKey)
    return (
      <p className="text-sm text-red-800">
        Spam protection is not configured. Please try again later.
      </p>
    );
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
      <div
        ref={containerRef}
        className="min-h-[4rem]"
        aria-label="Spam protection verification"
      />
      {failed && (
        <p className="text-sm text-red-800">
          Spam verification could not load. Please refresh and try again.
        </p>
      )}
    </>
  );
}
