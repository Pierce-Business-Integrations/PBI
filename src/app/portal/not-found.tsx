import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";

export default function PortalNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-12 text-[#233a30]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#567d50]">
        Project unavailable
      </p>
      <h1 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">
        We couldn’t open that project.
      </h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-[#233a30]/75">
        The link may be out of date, or this account may not have access to the
        project. Your other projects are still available in the workspace.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/portal"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#233a30] px-5 py-2 text-sm font-semibold text-white hover:bg-[#567d50]"
        >
          <ArrowLeft size={16} aria-hidden="true" /> All projects
        </Link>
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
