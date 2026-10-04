"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectDetails } from "@/lib/portal/schema";

const asLines = (items: string[]) => items.join("\n");
const pairs = (
  items: { heading: string; description?: string; body?: string }[],
) =>
  items
    .map((item) => `${item.heading} | ${item.description || item.body || ""}`)
    .join("\n");
const split = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
const splitPairs = (value: string, valueKey: "description" | "body") =>
  split(value).map((line) => {
    const [heading, ...rest] = line.split("|");
    return { heading: heading.trim(), [valueKey]: rest.join("|").trim() };
  });

export default function ProjectEditor({
  initial,
  projectId,
}: {
  initial: ProjectDetails;
  projectId?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<ProjectDetails>(initial);
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [raw, setRaw] = useState(() => ({
    scope: pairs(initial.scope),
    deliverables: asLines(initial.deliverables),
    exclusions: asLines(initial.exclusions),
    schedule: initial.paymentSchedule
      .map((p) => `${p.label} | ${p.amountCents / 100} | ${p.due}`)
      .join("\n"),
    assumptions: asLines(initial.assumptions),
    terms: pairs(initial.terms),
    signers: initial.authorizedSigners
      .map((s) => `${s.name} | ${s.email} | ${s.title} | ${s.order}`)
      .join("\n"),
  }));
  const rawSet = (key: keyof typeof raw, value: string) =>
    setRaw((current) => ({ ...current, [key]: value }));
  const field = (
    label: string,
    value: string,
    update: (value: string) => void,
    area = false,
  ) => (
    <label className="block text-sm font-semibold">
      <span>{label}</span>
      {area ? (
        <textarea
          value={value}
          onChange={(e) => update(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-[#779c69]/50 bg-white p-3 font-normal"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => update(e.target.value)}
          className="mt-1 w-full rounded-md border border-[#779c69]/50 bg-white p-3 font-normal"
        />
      )}
    </label>
  );
  const set = (key: keyof ProjectDetails, value: unknown) =>
    setData((current) => ({ ...current, [key]: value }));
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const complete = {
        ...data,
        scope: splitPairs(raw.scope, "description"),
        deliverables: split(raw.deliverables),
        exclusions: split(raw.exclusions),
        assumptions: split(raw.assumptions),
        terms: splitPairs(raw.terms, "body"),
        paymentSchedule: split(raw.schedule).map((line) => {
          const [label, amount, ...due] = line.split("|");
          return {
            label: label.trim(),
            amountCents: Math.round(Number(amount) * 100),
            due: due.join("|").trim(),
          };
        }),
        authorizedSigners: split(raw.signers).map((line) => {
          const [name, email, title, order] = line
            .split("|")
            .map((s) => s.trim());
          return { name, email, title, order: Number(order) };
        }),
      };
      const response = await fetch(
        projectId
          ? `/api/portal/projects/${projectId}`
          : "/api/portal/projects",
        {
          method: projectId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(complete),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Save failed");
      router.push(`/portal/${projectId || result.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
      setBusy(false);
    }
  }
  return (
    <div className="mt-5 space-y-7 rounded-xl border border-[#779c69]/40 bg-white p-5 md:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        {field("Internal label", data.label, (v) => set("label", v))}
        {field("Organization", data.organizationName, (v) =>
          set("organizationName", v),
        )}
        {field("Contact name", data.contactName, (v) => set("contactName", v))}
        {field("Contact email", data.contactEmail, (v) =>
          set("contactEmail", v),
        )}
        {field("Project name", data.projectName, (v) => set("projectName", v))}
        {field("Prepared by", data.preparedBy, (v) => set("preparedBy", v))}
      </div>
      {field("Summary", data.summary, (v) => set("summary", v), true)}
      {field("Business problem", data.problem, (v) => set("problem", v), true)}
      {field(
        "Desired outcome",
        data.desiredOutcome,
        (v) => set("desiredOutcome", v),
        true,
      )}
      {field(
        "Scope — one heading | description per line",
        raw.scope,
        (v) => rawSet("scope", v),
        true,
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {field(
          "Deliverables — one per line",
          raw.deliverables,
          (v) => rawSet("deliverables", v),
          true,
        )}
        {field(
          "Exclusions — one per line",
          raw.exclusions,
          (v) => rawSet("exclusions", v),
          true,
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold">
          Pricing model
          <select
            value={data.pricing.model}
            onChange={(e) =>
              set("pricing", { ...data.pricing, model: e.target.value })
            }
            className="mt-1 w-full rounded-md border p-3"
          >
            <option value="fixed">Fixed</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        {field("Price in USD", String(data.pricing.amountCents / 100), (v) =>
          set("pricing", {
            ...data.pricing,
            amountCents: Math.round(Number(v) * 100),
          }),
        )}
        {field("Price description", data.pricing.description, (v) =>
          set("pricing", { ...data.pricing, description: v }),
        )}
        {field(
          "Payment schedule — label | amount USD | due",
          raw.schedule,
          (v) => rawSet("schedule", v),
          true,
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {field("Estimated start (YYYY-MM-DD)", data.estimatedStart, (v) =>
          set("estimatedStart", v),
        )}
        {field("Estimated end", data.estimatedEnd || "", (v) =>
          set("estimatedEnd", v || undefined),
        )}
        {field("Proposal valid until", data.proposalValidUntil, (v) =>
          set("proposalValidUntil", v),
        )}
      </div>
      {field(
        "Assumptions — one per line",
        raw.assumptions,
        (v) => rawSet("assumptions", v),
        true,
      )}
      {field(
        "Proposed terms — heading | body per line; legal review required",
        raw.terms,
        (v) => rawSet("terms", v),
        true,
      )}
      {field(
        "Authorized signers — name | email | title | order",
        raw.signers,
        (v) => rawSet("signers", v),
        true,
      )}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={data.requiresPbiSignature}
          onChange={(e) => set("requiresPbiSignature", e.target.checked)}
        />
        PBI signature required
      </label>
      <details className="border-t pt-4">
        <summary className="cursor-pointer font-semibold">
          Import validated JSON
        </summary>
        <p className="my-2 text-sm">
          Paste a complete object matching{" "}
          <code>docs/client-portal/example-project.json</code>. Review all
          fields before saving.
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={8}
          className="w-full rounded-md border p-3 font-mono text-xs"
        />
        <button
          type="button"
          onClick={() => {
            try {
              const value = JSON.parse(importText) as ProjectDetails;
              setData(value);
              setRaw({
                scope: pairs(value.scope),
                deliverables: asLines(value.deliverables),
                exclusions: asLines(value.exclusions),
                schedule: value.paymentSchedule
                  .map((p) => `${p.label} | ${p.amountCents / 100} | ${p.due}`)
                  .join("\n"),
                assumptions: asLines(value.assumptions),
                terms: pairs(value.terms),
                signers: value.authorizedSigners
                  .map(
                    (s) => `${s.name} | ${s.email} | ${s.title} | ${s.order}`,
                  )
                  .join("\n"),
              });
              setMessage("JSON loaded. Review fields and save to validate.");
            } catch {
              setMessage("Invalid JSON syntax");
            }
          }}
          className="mt-2 rounded-full border px-4 py-2"
        >
          Load JSON
        </button>
      </details>
      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="rounded-full bg-[#233a30] px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Saving…" : projectId ? "Save project draft" : "Create project"}
      </button>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
