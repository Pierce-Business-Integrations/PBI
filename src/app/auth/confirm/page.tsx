import AccountShell from "@/components/account/AccountShell";
import InvitationForm from "@/components/account/InvitationForm";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Client invitation",
  robots: { index: false, follow: false },
};
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}) {
  const { token_hash: token, type } = await searchParams;
  return (
    <AccountShell
      eyebrow="Client access"
      title="Your workspace is ready."
      description="Accept your invitation to access your PBI projects and documents."
    >
      <InvitationForm token={token || ""} type={type || ""} />
    </AccountShell>
  );
}
