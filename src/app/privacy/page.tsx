import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { pageMetadata, site } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Privacy Policy",
  "Privacy policy describing how Pierce Business Integrations handles website inquiries and usage information.",
  "/privacy",
);

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="September 28, 2026">
      <h2>Purpose of this notice</h2>
      <p>
        This policy explains how Pierce Business Integrations, a brand of Pierce
        Business Group LLC, may handle information submitted through this
        website and information generated through normal website use.
      </p>
      <h2>Information you choose to provide</h2>
      <p>
        If you contact Pierce Business Integrations by email or through a
        connected consultation form or an invited project intake, you may
        provide contact details, business information, project details, and
        other information included in your answers. Please do not submit
        passwords, account credentials, payment information, sensitive customer
        data, or medical information through these forms.
      </p>
      <h2>Website and analytics information</h2>
      <p>
        This website may use basic server logs, analytics tools, and marketing
        attribution parameters when they are present in a landing URL. This may
        include referral information, campaign parameters, and advertising click
        identifiers. Contact submissions are also checked by anti-spam
        infrastructure.
      </p>
      <h2>How information may be used</h2>
      <p>
        Information may be used to respond to inquiries, evaluate a potential
        project, provide requested services, maintain website security, and
        understand how the website is used. Pierce Business Integrations does
        not sell information submitted through these forms.
      </p>
      <h2>Service providers and retention</h2>
      <p>
        Hosting, analytics, email-delivery, and anti-spam providers may process
        information on behalf of Pierce Business Integrations to operate the
        website and deliver inquiries. Information is retained only as
        reasonably needed for the inquiry, service relationship, security,
        recordkeeping, or applicable business obligations.
      </p>
      <h2>Your questions</h2>
      <p>
        Questions about this policy may be sent through our{" "}
        <a href="/contact">contact page</a>
        {site.email && (
          <>
            {" "}
            or by email to <a href={`mailto:${site.email}`}>{site.email}</a>
          </>
        )}
        .
      </p>
    </LegalPage>
  );
}
