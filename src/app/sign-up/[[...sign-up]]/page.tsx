import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import { accountClerkAppearance } from "@/components/account/clerk-appearance";
import { configuredClerk, portalActor } from "@/lib/portal/auth";

export const dynamic = "force-dynamic";

export default async function SignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ "sign-up"?: string[] }>;
  searchParams: Promise<{ __clerk_ticket?: string }>;
}) {
  if (await portalActor()) redirect("/account");
  const ticket = (await searchParams).__clerk_ticket;
  const step = (await params)["sign-up"];
  if (!configuredClerk || (!ticket && !step?.length)) redirect("/clients");
  return (
    <AccountShell
      eyebrow="By invitation only"
      title="Join your client workspace."
      description="This setup is for clients invited by PBI. Use the invitation sent to you to complete your sign-in."
    >
      {configuredClerk ? (
        <div className="w-full max-w-md">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/account"
            appearance={accountClerkAppearance}
          />
          <p className="mt-4 text-center text-xs leading-5 text-[#233a30]/70">
            An invitation alone does not grant project access. PBI assigns your
            workspace after verifying your identity.
          </p>
        </div>
      ) : null}
    </AccountShell>
  );
}
