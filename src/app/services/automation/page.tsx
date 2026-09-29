import type { Metadata } from "next";
import ServiceDetailPage from "@/components/ServiceDetailPage";
import { pageMetadata, services } from "@/lib/site";
const service = services.find((item) => item.slug === "automation")!;
export const metadata: Metadata = pageMetadata(
  "Business Systems & Integrations in North Georgia",
  "Pierce Business Integrations diagnoses operational friction and architects custom applications, integrations, and practical improvements for North Georgia businesses.",
  "/services/automation",
);
export default function Page() {
  return <ServiceDetailPage service={service} />;
}
