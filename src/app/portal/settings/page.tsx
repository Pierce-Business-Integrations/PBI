import Link from "next/link";
import { redirect } from "next/navigation";
import { portalActor, isAdmin } from "@/lib/portal/auth";
import { portalSetupReport } from "@/lib/portal/readiness";
import SetupPanel from "./setup-panel";
export const dynamic = "force-dynamic";
export default async function PortalSettings() {
  const actor = await portalActor();
  if (!actor) redirect("/sign-in?redirect_url=%2Fportal%2Fsettings");
  if (!(await isAdmin(actor.userId))) redirect("/portal");
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/portal"
        className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
      >
        Back to projects
      </Link>
      <header>
        <h1 className="text-3xl font-semibold">Portal setup</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#233a30]/75">
          Owner-only connection checks for accounts, documents, signing, and
          payments. Keys stay on the server. A verified connection is a setup
          check; the complete client workflow must still be tested.
        </p>
      </header>
      <SetupPanel initial={await portalSetupReport()} />
      <section className="rounded-xl border border-[#233a30]/15 bg-white p-6">
        <h2 className="text-lg font-semibold">Before inviting GoToHearing</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-[#233a30]/80">
          <li>
            Configure Supabase SMTP, invitation-only accounts, and the
            client-domain callbacks. Test two separate client identities.
          </li>
          <li>
            Review the actual scope, fees, payment schedule, authorized signers,
            and agreement terms. The sample is not a client contract.
          </li>
          <li>
            Complete SignWell sandbox signing and retrieve its completed PDF and
            audit record.
          </li>
          <li>
            Complete Stripe test card/ACH payments, duplicate callbacks, delayed
            confirmation, and refund checks.
          </li>
          <li>
            Schedule provider recovery and verify database and private-file
            backups.
          </li>
        </ul>
      </section>
    </div>
  );
}
