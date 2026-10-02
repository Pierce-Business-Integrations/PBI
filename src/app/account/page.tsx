import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { ArrowRight, FileText, Settings2 } from "lucide-react";
import {
  authenticatedActor,
  configuredClerk,
  hasPortalAccess,
} from "@/lib/portal/auth";
import { listProjects } from "@/lib/portal/repository";
import PortalActions from "@/app/portal/portal-actions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const actor = await authenticatedActor();
  if (!actor) redirect("/clients");
  const hasAccess = await hasPortalAccess(actor.userId);
  const user = actor && configuredClerk ? await currentUser() : null;
  const projects = hasAccess ? await listProjects(actor) : [];
  const name =
    user?.firstName ||
    (actor?.simulated
      ? actor.userId.replace("dev-", "Demo ").replaceAll("-", " ")
      : "Your workspace");
  return (
    <div className="min-h-screen bg-[#f9f3ed] px-5 pb-20 pt-10 text-[#233a30] sm:pt-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d8a45b]/70 pb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">
            Pierce Business Integrations / Clients
          </p>
          <Link
            href="/contact"
            className="text-sm font-medium underline underline-offset-4"
          >
            Need help? Contact us
          </Link>
        </div>
        {!hasAccess ? (
          <>
            <div className="mt-12 grid gap-9 lg:grid-cols-[1fr_0.85fr] lg:items-stretch">
              <div className="rounded-2xl bg-[#233a30] p-8 text-[#f9f3ed] sm:p-12">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d8a45b]">
                  Client access
                </p>
                <h1 className="mt-8 max-w-lg font-serif text-4xl leading-tight sm:text-5xl">
                  This sign-in is not connected to a client project.
                </h1>
                <p className="mt-6 max-w-lg text-base leading-7 text-[#f9f3ed]/85">
                  Only clients and authorized team members invited by PBI can
                  enter the workspace. If you expected access, contact us so we
                  can verify your details.
                </p>
                <p className="mt-14 border-t border-[#f9f3ed]/20 pt-5 text-xs font-medium uppercase tracking-[0.15em] text-[#d8a45b]">
                  Modern solutions. Local partnership.
                </p>
              </div>
              <div className="flex flex-col justify-center rounded-2xl border border-[#d8a45b]/50 bg-white p-8 sm:p-10">
                <h2 className="font-serif text-3xl">Need help getting in?</h2>
                <p className="mt-3 text-sm leading-6 text-[#233a30]/75">
                  We can check whether your project access has been connected to
                  the right sign-in.
                </p>
                <Link
                  href="/contact"
                  className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#233a30] px-6 py-3 text-sm font-semibold text-white hover:bg-[#779c69]"
                >
                  Contact PBI <ArrowRight size={16} />
                </Link>
                <Link
                  href="/clients"
                  className="mt-3 inline-flex items-center justify-center rounded-full border border-[#233a30] px-6 py-3 text-sm font-semibold hover:bg-[#f9f3ed]"
                >
                  About client access
                </Link>
                {configuredClerk && (
                  <SignOutButton>
                    <button className="mt-4 text-sm font-medium underline underline-offset-4">
                      Sign out of this identity
                    </button>
                  </SignOutButton>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mt-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#779c69]">
                  Client workspace
                </p>
                <h1 className="mt-3 font-serif text-4xl sm:text-5xl">
                  Welcome, {name}.
                </h1>
                <p className="mt-4 max-w-2xl text-[#233a30]/75">
                  Your profile and the work we’re doing together, all in one
                  place.
                </p>
              </div>
              {configuredClerk && (
                <SignOutButton>
                  <button className="rounded-full border border-[#233a30] px-5 py-2 text-sm font-medium hover:bg-white">
                    Sign out
                  </button>
                </SignOutButton>
              )}
            </div>
            {actor.simulated && (
              <div className="mt-7 rounded-xl border border-[#d8a45b] bg-white p-5 text-sm">
                <strong>Local demo identity — not a real client login.</strong>
                <p className="mt-1">
                  Switch between the owner and two isolated client views below.
                </p>
                <PortalActions />
              </div>
            )}
            <div className="mt-9 grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
              <Link
                href="/portal"
                className="group rounded-2xl border border-[#233a30] bg-[#233a30] p-8 text-[#f9f3ed] shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <FileText
                  size={28}
                  strokeWidth={1.5}
                  className="text-[#d8a45b]"
                />
                <h2 className="mt-6 font-serif text-3xl">Client portal</h2>
                <p className="mt-3 text-sm leading-6 text-[#f9f3ed]/80">
                  {projects.length
                    ? `View ${projects.length} assigned ${projects.length === 1 ? "project" : "projects"}, documents, signing, and invoices.`
                    : "Your projects and documents will appear here once PBI links your account."}
                </p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#d8a45b] group-hover:gap-3">
                  Open portal <ArrowRight size={16} />
                </span>
              </Link>
              <Link
                href="/account/profile"
                className="group rounded-2xl border border-[#d8a45b]/50 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-[#233a30]"
              >
                <Settings2
                  size={28}
                  strokeWidth={1.5}
                  className="text-[#779c69]"
                />
                <h2 className="mt-6 font-serif text-3xl">Profile & security</h2>
                <p className="mt-3 text-sm leading-6 text-[#233a30]/75">
                  {configuredClerk
                    ? "Review your personal details, email addresses, and account security settings."
                    : "This is a local demo profile. Real account settings require Clerk configuration."}
                </p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold group-hover:gap-3">
                  View profile <ArrowRight size={16} />
                </span>
              </Link>
            </div>
            {projects.length === 0 && (
              <p className="mt-8 rounded-xl border border-[#d8a45b]/50 bg-white p-5 text-sm leading-6">
                Have an active PBI project that is not showing here?{" "}
                <Link href="/contact" className="font-semibold underline">
                  Contact us
                </Link>{" "}
                so we can verify and connect your account.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
