"use client";
import { useState } from "react";
export default function SignOut({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <button
        disabled={busy}
        className={className}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const response = await fetch("/api/portal/auth/sign-out", {
              method: "POST",
            });
            if (!response.ok)
              throw new Error("Unable to sign out. Please try again.");
            window.location.replace("/sign-in");
          } catch (failure) {
            setError(
              failure instanceof Error ? failure.message : "Please try again.",
            );
            setBusy(false);
          }
        }}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
    </>
  );
}
