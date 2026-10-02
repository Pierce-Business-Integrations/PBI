import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { configuredClerk } from "@/lib/portal/auth";

export const metadata: Metadata = {
  title: "Client portal",
  robots: { index: false, follow: false },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const body = (
    <div className="min-h-screen bg-[#f7f6f2] px-5 pb-20 pt-9 text-[#233a30] sm:px-8 sm:pt-12 xl:px-12">
      <div className="mx-auto max-w-7xl">{children}</div>
    </div>
  );
  return configuredClerk ? <ClerkProvider>{body}</ClerkProvider> : body;
}
