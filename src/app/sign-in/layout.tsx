import type { Metadata } from "next";
import AccountAuthLayout from "@/components/account/AccountAuthLayout";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountAuthLayout>{children}</AccountAuthLayout>;
}
