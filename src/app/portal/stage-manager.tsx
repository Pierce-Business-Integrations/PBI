"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  currentStageIndex,
  stageLabel,
  type StageInput,
  type ProjectStage,
} from "@/lib/portal/stages";
import { formatMoney } from "@/lib/portal/presentation";
import type { StageInvoice } from "./project-tracker";

const inputClass =
  "mt-2 w-full rounded-lg border border-[#233a30]/20 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#779c69]";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#233a30]/30 px-4 py-2 text-sm font-semibold hover:bg-[#e9eee6] disabled:opacity-50";

export default function StageManager({
  projectId,
  version,
  stages: initial,
  invoices,
}: {
  projectId: string;
  version: number;
  stages: ProjectStage[];
  invoices: StageInvoice[];
}) {
  const router = useRouter();
  const [stages, setStages] = useState<StageInput[]>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});
  const saved = new Set(initial.map((stage) => stage.id));
  function edit(id: string, patch: Partial<StageInput>) {
    setStages((items) =>
      items.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage)),
    );
  }
  function move(index: number, direction: number) {
    setStages((items) => {
      const next = [...items];
      [next[index], next[index + direction]] = [
        next[index + direction],
        next[index],
      ];
      return next;
    });
  }
  async function save(nextStages = stages) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/portal/projects/${projectId}/stages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, stages: nextStages }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to save stages");
      setMessage("Stage plan saved.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save stages",
      );
    } finally {
      setBusy(false);
    }
  }
  async function attach(stageId: string) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/portal/projects/${projectId}/stages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, invoiceId: links[stageId] }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to attach invoice");
      setMessage("Invoice linked to stage.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to attach invoice",
      );
    } finally {
      setBusy(false);
    }
  }
  function useTemplate() {
    setStages(
      [
        [
          "Discovery",
          "Understand the business problem, current workflow, and priorities.",
          "Discovery summary\nAgreed priorities",
        ],
        [
          "Solution design",
          "Define the approach, requirements, and a practical delivery plan.",
          "Solution plan\nConfirmed scope",
        ],
        [
          "Build & integrate",
          "Implement the agreed solution and connect the tools it needs.",
          "Working solution\nConnected workflows",
        ],
        [
          "Review & refine",
          "Review the solution together and work through feedback.",
          "Client review\nFinal refinements",
        ],
        [
          "Launch & handoff",
          "Put the solution into use and hand over the information your team needs.",
          "Launch checklist\nTeam handoff",
        ],
      ].map(([title, description, deliverables]) => ({
        id: crypto.randomUUID(),
        title,
        description,
        deliverables: deliverables.split("\n"),
        status: "planned",
      })),
    );
  }
  return (
    <details
      id="manage-stages"
      className="group rounded-xl border border-[#233a30]/15 bg-white p-5"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 marker:hidden">
        <span>
          <span className="block text-[11px] font-medium text-[#55725c]">
            Owner tools
          </span>
          <span className="mt-1 block text-sm font-semibold">
            Manage project stages
          </span>
          <span className="mt-1 block text-xs text-[#233a30]/75">
            Set the sequence, update progress, and connect invoices.
          </span>
        </span>
        <Plus
          size={22}
          aria-hidden="true"
          className="shrink-0 transition group-open:rotate-45"
        />
      </summary>
      <div
        className="mt-7 space-y-5 border-t border-[#233a30]/10 pt-6"
        aria-busy={busy}
      >
        {stages.length === 0 && (
          <button type="button" onClick={useTemplate} className={buttonClass}>
            Start with a standard sequence
          </button>
        )}
        {stages.map((stage, index) => {
          const invoice = invoices.find(
            (item) => item.stageId === stage.id && item.status !== "voided",
          );
          const unassigned = invoices.filter(
            (item) => !item.stageId && item.status === "open",
          );
          return (
            <fieldset
              key={stage.id}
              className="rounded-xl border border-[#233a30]/15 p-5"
            >
              <legend className="px-2 text-xs font-semibold uppercase tracking-wide">
                Stage {index + 1}
              </legend>
              <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
                <label className="text-sm font-medium">
                  Stage name
                  <input
                    maxLength={80}
                    value={stage.title}
                    onChange={(event) =>
                      edit(stage.id, { title: event.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-medium">
                  Work status
                  <select
                    value={stage.status}
                    onChange={(event) =>
                      edit(stage.id, {
                        status: event.target.value as StageInput["status"],
                      })
                    }
                    className={inputClass}
                  >
                    {[
                      "planned",
                      "in_progress",
                      "waiting_on_client",
                      "complete",
                    ].map((status) => (
                      <option key={status} value={status}>
                        {stageLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium sm:col-span-2">
                  What happens in this stage
                  <textarea
                    maxLength={800}
                    rows={2}
                    value={stage.description}
                    onChange={(event) =>
                      edit(stage.id, { description: event.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-medium sm:col-span-2">
                  Deliverables (one per line)
                  <textarea
                    rows={2}
                    value={stage.deliverables.join("\n")}
                    onChange={(event) =>
                      edit(stage.id, {
                        deliverables: event.target.value.split("\n"),
                      })
                    }
                    className={inputClass}
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move ${stage.title || "stage"} earlier`}
                  className={buttonClass}
                >
                  <ArrowUp size={14} aria-hidden="true" /> Earlier
                </button>
                <button
                  type="button"
                  disabled={busy || index === stages.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move ${stage.title || "stage"} later`}
                  className={buttonClass}
                >
                  <ArrowDown size={14} aria-hidden="true" /> Later
                </button>
                <button
                  type="button"
                  disabled={
                    busy || invoices.some((item) => item.stageId === stage.id)
                  }
                  onClick={() =>
                    setStages((items) =>
                      items.filter((item) => item.id !== stage.id),
                    )
                  }
                  aria-label={`Remove ${stage.title || "stage"}`}
                  className={buttonClass}
                >
                  <Trash2 size={14} aria-hidden="true" /> Remove
                </button>
              </div>
              {invoice ? (
                <p className="mt-4 text-sm">
                  Linked invoice:{" "}
                  <strong>{formatMoney(invoice.amountCents)}</strong>
                </p>
              ) : saved.has(stage.id) && unassigned.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <label className="min-w-48 flex-1 text-sm font-medium">
                    Existing invoice
                    <select
                      value={links[stage.id] || ""}
                      onChange={(event) =>
                        setLinks((current) => ({
                          ...current,
                          [stage.id]: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">Choose an unassigned invoice</option>
                      {unassigned.map((item) => (
                        <option key={item.id} value={item.id}>
                          {formatMoney(item.amountCents)} ·{" "}
                          {item.id.slice(0, 8)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    disabled={busy || !links[stage.id]}
                    onClick={() => attach(stage.id)}
                    className={buttonClass}
                  >
                    Attach invoice
                  </button>
                </div>
              ) : null}
            </fieldset>
          );
        })}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || stages.length >= 12}
            onClick={() =>
              setStages((items) => [
                ...items,
                {
                  id: crypto.randomUUID(),
                  title: "",
                  description: "",
                  deliverables: [],
                  status: "planned",
                },
              ])
            }
            className={buttonClass}
          >
            <Plus size={15} aria-hidden="true" /> Add stage
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              save(
                stages.map((stage) => ({
                  ...stage,
                  deliverables: stage.deliverables
                    .map((item) => item.trim())
                    .filter(Boolean),
                })),
              )
            }
            className="rounded-full bg-[#233a30] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save stage plan"}
          </button>
          {initial.length > 0 &&
            initial.some(
              (stage) =>
                stage.status === "in_progress" ||
                stage.status === "waiting_on_client",
            ) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const index = currentStageIndex(initial);
                  save(
                    initial.map((stage, position) => ({
                      ...stage,
                      status:
                        position <= index
                          ? "complete"
                          : position === index + 1
                            ? "in_progress"
                            : "planned",
                    })),
                  );
                }}
                className={buttonClass}
              >
                Complete current & start next
              </button>
            )}
        </div>
        {message && (
          <p role="status" className="text-sm leading-6">
            {message}
          </p>
        )}
      </div>
    </details>
  );
}
