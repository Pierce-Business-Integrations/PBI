import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";
import { FolderOpen } from "lucide-react";
import { redirect } from "next/navigation";
import { accountClerkAppearance } from "@/components/account/clerk-appearance";
import { configuredClerk, portalActor } from "@/lib/portal/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const actor = await portalActor();
  if (!actor) redirect("/sign-in?redirect_url=%2Faccount%2Fprofile");
  return (
    <div className="min-h-screen bg-[#f9f3ed] px-5 pb-20 pt-10 text-[#233a30] sm:pt-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/account"
          className="text-sm font-medium underline underline-offset-4"
        >
          ← Back to client home
        </Link>
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#779c69]">
            Your profile
          </p>
          <h1 className="mt-3 font-serif text-4xl">Profile & security</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6">
            Manage your account details and return to your client portal
            whenever you need project information.
          </p>
        </div>
        {configuredClerk ? (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-[#d8a45b]/40 bg-white p-3 sm:p-6">
            <UserProfile
              path="/account/profile"
              routing="path"
              appearance={accountClerkAppearance}
            >
              <UserProfile.Link
                label="Client portal"
                labelIcon={<FolderOpen size={16} />}
                url="/portal"
              />
            </UserProfile>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-[#d8a45b]/40 bg-white p-8">
            <p className="text-sm font-semibold">Local demo profile</p>
            <p className="mt-3 text-sm">
              This simulated identity has no editable account details or Google
              connection. Real profile management appears here when Clerk is
              configured.
            </p>
            <Link
              href="/portal"
              className="mt-6 inline-block rounded-full bg-[#233a30] px-5 py-3 text-sm font-semibold text-white"
            >
              Open client portal
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
