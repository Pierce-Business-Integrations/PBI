"use client";

import Link from "next/link";
import { RotateCcw, LifeBuoy } from "lucide-react";

export default function PortalError({ retry }: { retry: () => void }) {
  return (
    <div
      className="mx-auto max-w-3xl px-5 pb-20 pt-12 text-[#233a30]"
      role="alert"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#567d50]">
        Workspace update
      </p>
      <h1 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">
        This page didn’t load completely.
      </h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-[#233a30]/75">
        Your project information is still protected. Try loading it again, or
        contact PBI if the problem continues.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={retry}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#233a30] px-5 py-2 text-sm font-semibold text-white hover:bg-[#567d50]"
        >
          <RotateCcw size={16} aria-hidden="true" /> Try again
        </button>
        <Link
          href="/contact"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#233a30] px-5 py-2 text-sm font-semibold hover:bg-white"
        >
          <LifeBuoy size={16} aria-hidden="true" /> Ask for help
        </Link>
      </div>
    </div>
  );
}
