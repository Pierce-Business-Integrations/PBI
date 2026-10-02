import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import { accountClerkAppearance } from "@/components/account/clerk-appearance";
import { authenticatedActor, configuredClerk } from "@/lib/portal/auth";
import PortalActions from "@/app/portal/portal-actions";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  if (await authenticatedActor()) redirect("/account");
  return (
    <AccountShell
      eyebrow="For invited clients"
      title="Welcome back."
      description="Sign in to access the PBI projects and documents connected to your client workspace."
    >
      {configuredClerk ? (
        <SignIn
          path="/sign-in"
          routing="path"
          withSignUp={false}
          transferable={false}
          fallbackRedirectUrl="/account"
          appearance={accountClerkAppearance}
        />
      ) : process.env.NODE_ENV === "development" ? (
        <div className="w-full max-w-md">
          <h2 className="font-serif text-2xl">Local demo access</h2>
          <p className="mt-3 text-sm leading-6 text-[#233a30]/75">
            Real sign-in and Google are not configured in this environment.
            Choose a simulated identity to explore the portal. These are not
            accounts.
          </p>
          <PortalActions />
          <p className="mt-7 text-sm">
            Client access is provided by PBI. There is no public registration.
          </p>
        </div>
      ) : (
        <div className="max-w-md">
          <h2 className="font-serif text-2xl">
            Client sign-in is being configured.
          </h2>
          <p className="mt-3 text-sm">
            Please contact PBI if you need access to an existing project.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-full bg-[#233a30] px-5 py-3 text-sm font-semibold text-white"
          >
            Contact PBI
          </Link>
        </div>
      )}
    </AccountShell>
  );
}
