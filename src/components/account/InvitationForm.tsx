"use client";
import Link from "next/link";
import { useState } from "react";
export default function InvitationForm({
  token,
  type,
}: {
  token: string;
  type: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!token || !["invite", "recovery"].includes(type))
    return (
      <p>
        This link is incomplete.{" "}
        <Link className="underline" href="/sign-in">
          Return to sign-in
        </Link>
        .
      </p>
    );
  return (
    <div className="w-full max-w-sm">
      <p className="mb-6 text-sm leading-6 text-[#233a30]/75">
        Continue to confirm your email and finish setting up your profile.
      </p>
      <button
        disabled={busy}
        className="w-full rounded-lg bg-[#233a30] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            // Explicit POST prevents email security scanners consuming one-time invitations.
            const response = await fetch("/api/portal/auth/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, type }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            window.location.replace(result.url);
          } catch (failure) {
            setError(
              failure instanceof Error ? failure.message : "Please try again.",
            );
            setBusy(false);
          }
        }}
      >
        {busy ? "Opening your workspace…" : "Accept invitation"}
      </button>
      {error && (
        <p role="alert" className="mt-4 text-sm text-[#773f36]">
          {error}
        </p>
      )}
    </div>
  );
}
