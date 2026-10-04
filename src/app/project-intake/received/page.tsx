import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { INTAKE_COOKIE_NAME, intakeSessionIsValid } from "@/lib/intake-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Project Intake Received",
  referrer: "no-referrer",
  robots: { index: false, follow: false, nocache: true },
};

export default async function IntakeReceivedPage() {
  const cookieStore = await cookies();
  if (!intakeSessionIsValid(cookieStore.get(INTAKE_COOKIE_NAME)?.value))
    notFound();
  return (
    <>
      <PageHero title="Project intake received.">
        <p>
          Thank you for sharing the details. I’ll review them personally and
          follow up about the right next step. A confirmation email should
          arrive shortly.
        </p>
        <p className="mt-4">
          Need to correct or add something? Reply to the confirmation email.
        </p>
        <Link href="/" className="btn-outline mt-9">
          Return home
        </Link>
      </PageHero>
      <Footer />
    </>
  );
}
