type Document = { id: string; kind: string; status: string };
type Invoice = {
  documentId: string;
  status: string;
  simulationStatus?: string | null;
};
type Signing = { documentId: string; status: string };

export type ProjectFocus = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
};

export function projectFocus({
  documents,
  invoices,
  signing,
  admin,
  simulated,
}: {
  documents: Document[];
  invoices: Invoice[];
  signing: Signing[];
  admin: boolean;
  simulated: boolean;
}): ProjectFocus {
  const processing = invoices.find(
    (invoice) => invoice.status === "processing",
  );
  if (processing)
    return {
      eyebrow: "Payment update",
      title: "Payment confirmation is pending.",
      description:
        "The invoice remains in processing until the payment provider confirms the result. You can review its current status below.",
      href: `#document-${processing.documentId}`,
      action: "View invoice status",
    };

  const activeSigning = signing.find((request) =>
    ["pending", "awaiting_file", "simulated_pending"].includes(request.status),
  );
  const simulatedSigning =
    simulated || activeSigning?.status.startsWith("simulated_");
  if (activeSigning)
    return {
      eyebrow: simulatedSigning ? "Demo signing step" : "Agreement update",
      title: simulatedSigning
        ? "A signing simulation is ready."
        : "Signing is in progress.",
      description: simulatedSigning
        ? "Open the agreement to try the local signing step. No legal signature or signed PDF will be created."
        : "Open the agreement to review its status and see whether a signing action is available to you.",
      href: `#document-${activeSigning.documentId}`,
      action: "View agreement",
    };

  const simulatedPaid =
    simulated &&
    invoices.find(
      (invoice) =>
        invoice.simulationStatus === "simulated_paid" &&
        invoice.status === "open",
    );
  if (simulatedPaid)
    return {
      eyebrow: "Demo payment state",
      title: "The payment simulation is complete.",
      description:
        "The demo step was recorded, but the real invoice remains open and no charge occurred. You can review both statuses below.",
      href: `#document-${simulatedPaid.documentId}`,
      action: "View invoice status",
    };

  const simulatedProcessing =
    simulated &&
    invoices.find(
      (invoice) =>
        invoice.simulationStatus === "simulated_processing" &&
        invoice.status === "open",
    );
  if (simulatedProcessing)
    return {
      eyebrow: "Demo payment state",
      title: "A payment simulation is in progress.",
      description:
        "This is a local demonstration only. Choose a simulated outcome on the invoice below; no charge will occur.",
      href: `#document-${simulatedProcessing.documentId}`,
      action: "View demo step",
    };

  const payable = invoices.find(
    (invoice) =>
      ["open", "failed"].includes(invoice.status) &&
      documents.some(
        (document) =>
          document.id === invoice.documentId && document.status === "approved",
      ),
  );
  if (payable)
    return {
      eyebrow: "Invoice available",
      title: simulated
        ? "An invoice is ready to review."
        : "An invoice is ready for payment.",
      description: simulated
        ? "Review the invoice and try the clearly labeled local payment simulation. No charge will occur."
        : "Review the invoice details below, then continue to secure checkout when you’re ready.",
      href: `#document-${payable.documentId}`,
      action: "View invoice",
    };

  const draft =
    admin && documents.find((document) => document.status === "draft");
  if (draft)
    return {
      eyebrow: "Owner review",
      title: "A document version is ready to review.",
      description:
        "Check the generated PDF and its commercial details before approving this exact version.",
      href: `#document-${draft.id}`,
      action: "Review version",
    };

  if (documents.length === 0)
    return admin
      ? {
          eyebrow: "Getting started",
          title: "Prepare the first document.",
          description:
            "Review the project draft, then generate a proposal or agreement when its details are ready.",
          href: "#documents",
          action: "Prepare documents",
        }
      : {
          eyebrow: "Getting started",
          title: "Your project space is ready.",
          description:
            "PBI is preparing the documents for this project. They will appear here once shared with your account.",
          href: "#overview",
          action: "Read project brief",
        };

  const agreement = documents.find(
    (document) =>
      document.kind === "agreement" &&
      document.status === "approved" &&
      !signing.some((request) => request.documentId === document.id),
  );
  if (agreement)
    return admin
      ? {
          eyebrow: "Owner review",
          title: "The agreement is ready for signing setup.",
          description:
            "Review the approved version once more, then start the available sandbox signing step.",
          href: `#document-${agreement.id}`,
          action: "Review agreement",
        }
      : {
          eyebrow: "For your review",
          title: "Your agreement is available.",
          description:
            "You can review the approved agreement now. Signing will appear here when PBI starts that step.",
          href: `#document-${agreement.id}`,
          action: "View agreement",
        };

  const proposal = documents.find(
    (document) =>
      document.kind === "proposal" && document.status === "approved",
  );
  if (
    proposal &&
    !documents.some((document) => document.kind === "agreement") &&
    invoices.length === 0
  )
    return {
      eyebrow: "For your review",
      title: "Your proposal is available.",
      description:
        "Open the proposal to review its scope and details. Contact PBI if anything needs clarification.",
      href: `#document-${proposal.id}`,
      action: "View proposal",
    };

  return {
    eyebrow: "Project update",
    title: "Your project records are up to date.",
    description:
      "The latest documents and payment statuses are available below whenever you need them.",
    href: "#documents",
    action: "Browse records",
  };
}
