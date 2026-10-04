import type { Metadata } from "next";
import AccountAuthLayout from "@/components/account/AccountAuthLayout";

export const metadata: Metadata = {
  title: "Client invitation",
  robots: { index: false, follow: false },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountAuthLayout>{children}</AccountAuthLayout>;
}
