import type { Metadata } from "next";

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
    <div className="min-h-[calc(100dvh-10rem)] bg-[#f5f6f4] px-5 pb-12 pt-6 text-[#233a30] sm:px-8 sm:pt-8 xl:px-10">
      <div className="mx-auto max-w-[1180px]">{children}</div>
    </div>
  );
  return body;
}
