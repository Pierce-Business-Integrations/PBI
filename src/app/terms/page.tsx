import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { pageMetadata, site } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Website Terms",
  "Website terms governing use of the Pierce Business Integrations public website.",
  "/terms",
);

export default function TermsPage() {
  return (
    <LegalPage title="Website Terms" updated="October 3, 2026">
      <h2>Informational website</h2>
      <p>
        This website provides general information about Pierce Business
        Integrations, a brand of Pierce Business Group LLC, and its services.
        Website content is not a binding proposal, professional legal advice, or
        a guarantee of project availability, cost, timing, rankings, leads,
        revenue, advertising performance, or other results.
      </p>
      <h2>Project engagements</h2>
      <p>
        Any project or ongoing service is governed by a separate written
        proposal or agreement describing scope, responsibilities, pricing,
        payment terms, timing, third-party costs, and other applicable terms.
      </p>
      <h2>Project scope and costs</h2>
      <p>
        Project pricing depends on the agreed scope, complexity, integrations,
        and support requirements and is confirmed in writing before
        implementation begins. Third-party subscriptions, advertising spend,
        content production, and work outside the agreed scope may be priced
        separately.
      </p>
      <h2>Website content and intellectual property</h2>
      <p>
        The website’s original branding, copy, design, and other materials may
        not be reproduced or presented as another business’s work without
        permission. Third-party materials remain subject to their respective
        owners’ terms and licenses.
      </p>
      <h2>External services</h2>
      <p>
        This website may link to or use services operated by other providers.
        Pierce Business Integrations does not control third-party services,
        availability, content, or policies.
      </p>
      <h2>Changes and contact</h2>
      <p>
        These terms may be updated as the website and business practices change.
        Questions may be sent through our <a href="/contact">contact page</a>
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
