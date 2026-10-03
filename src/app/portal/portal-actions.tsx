"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PortalActions() {
  const router = useRouter();
  const [error, setError] = useState("");
  async function choose(actor: string) {
    const result = await fetch("/api/portal/dev-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor }),
    });
    if (!result.ok) {
      setError((await result.json()).error || "Unable to switch identity");
      return;
    }
    router.push("/portal");
  }
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {[
        ["dev-admin", "Owner"],
        ["dev-client-a", "Client A"],
        ["dev-client-b", "Client B"],
      ].map(([actor, label]) => (
        <button
          key={actor}
          type="button"
          onClick={() => choose(actor)}
          className="rounded-full border border-[#233a30] px-4 py-2 text-sm hover:bg-[#233a30] hover:text-white"
        >
          {label}
        </button>
      ))}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
