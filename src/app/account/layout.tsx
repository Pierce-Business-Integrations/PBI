import type { Metadata } from "next";
import AccountAuthLayout from "@/components/account/AccountAuthLayout";

export const metadata: Metadata = {
  title: "Client workspace",
  robots: { index: false, follow: false },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountAuthLayout>{children}</AccountAuthLayout>;
}
