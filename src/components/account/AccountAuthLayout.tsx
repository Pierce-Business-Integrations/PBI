import { ClerkProvider } from "@clerk/nextjs";
import { configuredClerk } from "@/lib/portal/auth";

export default function AccountAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return configuredClerk ? <ClerkProvider>{children}</ClerkProvider> : children;
}
