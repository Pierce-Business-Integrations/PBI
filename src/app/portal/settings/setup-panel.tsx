"use client";
import { useState } from "react";
import type { SetupReport } from "@/lib/portal/readiness";
export default function SetupPanel({ initial }: { initial: SetupReport }) {
  const [report, setReport] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function verify() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/portal/settings", { method: "POST" });
      const value = await response.json();
      if (!response.ok)
        throw new Error(value.error || "Connection checks failed");
      setReport(value);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Connection checks failed",
      );
    } finally {
      setBusy(false);
    }
  }
  async function recover() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/portal/maintenance", {
        method: "POST",
      });
      const value = await response.json();
      if (!response.ok)
        throw new Error(value.error || "Provider recovery failed");
      const stripe = value.stripe;
      const signing = value.signing;
      setMessage(
        `Payment updates: ${stripe.skipped ? "not configured" : `${stripe.events.completed} processed, ${stripe.events.remaining} queued; ${stripe.checkouts.recovered} checkouts recovered, ${stripe.checkouts.blocked} require review`}. Signing updates: ${signing.skipped ? "not configured" : `${signing.completed} processed, ${signing.remaining} queued`}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Provider recovery failed",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#233a30]/15 bg-white p-5">
        <div className="text-sm">
          <p className="font-semibold">
            Provider mode: {report.mode === "test" ? "Sandbox" : "Live"}
          </p>
          <p className="mt-1 text-[#233a30]/70">
            Client records {report.clientProjects ? "enabled" : "not enabled"}
          </p>
        </div>
        <button
          disabled={busy}
          onClick={verify}
          className="min-h-11 rounded-lg bg-[#233a30] px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Checking connections…" : "Verify connections"}
        </button>
      </div>
      {message && (
        <p role="status" className="text-sm leading-6">
          {message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={busy}
          onClick={recover}
          className="min-h-11 rounded-lg border border-[#233a30]/25 px-4 text-sm font-semibold disabled:opacity-60"
        >
          Retry provider updates
        </button>
        <p className="text-xs text-[#233a30]/70">
          Retries pending callbacks and safely recovers interrupted checkouts.
        </p>
      </div>
      <div className="divide-y divide-[#233a30]/15 rounded-xl border border-[#233a30]/15 bg-white">
        {report.checks.map((check) => (
          <article key={check.id} className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold">{check.name}</h2>
              <span
                className={`rounded-md px-2 py-1 text-xs font-medium ${check.status === "verified" ? "bg-[#779c69]/20" : "bg-[#f0ede7]"}`}
              >
                {check.status === "missing"
                  ? "Needs configuration"
                  : check.status === "configured"
                    ? "Not verified"
                    : check.status === "verified"
                      ? "Connection verified"
                      : "Needs attention"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#233a30]/75">
              {check.detail}
            </p>
            <p className="mt-3 break-words font-mono text-xs leading-6 text-[#233a30]/60">
              {check.variables.join(" · ")}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
