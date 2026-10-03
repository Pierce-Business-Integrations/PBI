import Link from "next/link";
import { redirect } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import SignInForm from "@/components/account/SignInForm";
import { authenticatedActor, configuredSupabase } from "@/lib/portal/auth";
import { authDestination } from "@/lib/portal/auth-navigation";
import PortalActions from "@/app/portal/portal-actions";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    switch?: string;
    next?: string;
    redirect_url?: string;
    error?: string;
  }>;
}) {
  const {
    switch: switchIdentity,
    next,
    redirect_url,
    error,
  } = await searchParams;
  if (await authenticatedActor()) {
    if (!(
      process.env.NODE_ENV === "development" &&
      !configuredSupabase &&
      switchIdentity === "1"
    ))
      redirect("/account");
  }
  return (
    <AccountShell
      eyebrow="For invited clients"
      title="Welcome back."
      description="Sign in to access the PBI projects and documents connected to your client workspace."
    >
      {configuredSupabase ? (
        <SignInForm
          next={authDestination(next || redirect_url)}
          callbackError={Boolean(error)}
        />
      ) : process.env.NODE_ENV === "development" &&
        !process.env.SUPABASE_DB_URL ? (
        <div className="w-full max-w-md">
          <h2 className="font-serif text-2xl">Preview access</h2>
          <p className="mt-3 text-sm leading-6 text-[#233a30]/75">
            Choose a role to explore the client workspace. Account sign-in
            becomes available after identity setup.
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
