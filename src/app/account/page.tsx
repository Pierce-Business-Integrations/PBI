import Link from "next/link";
import { redirect } from "next/navigation";
import SignOut from "@/components/account/SignOut";
import { ArrowRight, FileText, Settings2 } from "lucide-react";
import {
  authenticatedActor,
  configuredSupabase,
  portalUser,
  hasPortalAccess,
} from "@/lib/portal/auth";
import { listProjects } from "@/lib/portal/repository";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const actor = await authenticatedActor();
  if (!actor) redirect("/clients");
  const hasAccess = await hasPortalAccess(actor.userId);
  const user = configuredSupabase ? await portalUser() : null;
  const firstName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim().split(" ")[0]
      : "";
  const projects = hasAccess ? await listProjects(actor) : [];
  return (
    <div className="min-h-[calc(100dvh-10rem)] bg-[#f5f6f4] px-5 pb-12 pt-6 text-[#233a30] sm:px-8 sm:pt-8 xl:px-10">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#233a30]/15 pb-4">
          <p className="text-xs font-medium text-[#55725c]">Client home</p>
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
                {configuredSupabase && (
                  <SignOut className="mt-4 text-sm font-medium underline underline-offset-4" />
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
              <div>
                <h1 className="text-2xl font-semibold sm:text-[32px]">
                  {firstName ? `Welcome, ${firstName}.` : "Welcome back."}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-[#233a30]/75">
                  Access your projects and manage your profile.
                </p>
              </div>
              {configuredSupabase && (
                <SignOut className="rounded-full border border-[#233a30] px-5 py-2 text-sm font-medium hover:bg-white" />
              )}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Link
                href="/portal"
                className="group rounded-xl border border-[#233a30]/15 bg-white p-6 text-[#233a30] transition hover:border-[#567d50]/50"
              >
                <FileText
                  size={21}
                  strokeWidth={1.5}
                  className="text-[#55725c]"
                />
                <h2 className="mt-4 text-base font-semibold">Projects</h2>
                <p className="mt-2 text-sm leading-6 text-[#233a30]/75">
                  {projects.length
                    ? `View ${projects.length} assigned ${projects.length === 1 ? "project" : "projects"}, documents, signing, and invoices.`
                    : "Your projects and documents will appear here once PBI links your account."}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#233a30]">
                  View projects <ArrowRight size={16} />
                </span>
              </Link>
              <Link
                href="/account/profile"
                className="group rounded-xl border border-[#233a30]/15 bg-white p-6 transition hover:border-[#567d50]/50"
              >
                <Settings2
                  size={21}
                  strokeWidth={1.5}
                  className="text-[#779c69]"
                />
                <h2 className="mt-4 text-base font-semibold">
                  Profile & security
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#233a30]/75">
                  {configuredSupabase
                    ? "Review your personal details, sign-in email, and password."
                    : "Profile settings will be available when account access is configured."}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold">
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
