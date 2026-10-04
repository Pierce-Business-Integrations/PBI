import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FolderOpen, Plus } from "lucide-react";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isAdmin, portalActor } from "@/lib/portal/auth";
import { listProjects } from "@/lib/portal/repository";
import {
  formatPortalDate,
  projectDisplayName,
} from "@/lib/portal/presentation";
import ProjectEditor from "./project-editor";
import { clientProjectsEnabled } from "@/lib/portal/configuration";
import { emptyProjectDraft } from "@/lib/portal/project-draft";

export const dynamic = "force-dynamic";

export default async function PortalHome() {
  const actor = await portalActor();
  if (!actor) redirect("/sign-in?redirect_url=%2Fportal");
  const projects = await listProjects(actor);
  const admin = await isAdmin(actor.userId);
  const example = admin
    ? !actor.simulated && clientProjectsEnabled()
      ? emptyProjectDraft()
      : JSON.parse(
          await readFile(
            join(
              process.cwd(),
              "docs",
              "client-portal",
              "example-project.json",
            ),
            "utf8",
          ),
        )
    : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[32px]">
            Projects
          </h1>
          <p className="mt-2 text-sm text-[#233a30]/75">
            View progress, review documents, and manage project payments.
          </p>
        </div>
        {admin && (
          <div className="flex flex-wrap gap-3">
            <Link
              href="/portal/settings"
              className="inline-flex min-h-11 items-center rounded-lg border border-[#233a30]/20 px-4 text-xs font-semibold"
            >
              Portal setup
            </Link>
            <a
              href="#create-project"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#233a30] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3c5548]"
            >
              <Plus size={16} aria-hidden="true" /> New project
            </a>
          </div>
        )}
      </header>

      <section
        id="projects"
        aria-labelledby="projects-title"
        className="scroll-mt-28"
      >
        <div className="flex items-center justify-between border-b border-[#233a30]/15 pb-3 text-xs">
          <h2 id="projects-title" className="font-semibold">
            Your projects{" "}
            <span className="ml-2 rounded-md bg-[#e7eae4] px-1.5 py-0.5 tabular-nums">
              {projects.length}
            </span>
          </h2>
          <span className="text-[#233a30]/75">Most recently updated</span>
        </div>
        {projects.length ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-[#233a30]/15 bg-white">
            {projects.map((project) => (
              <Link
                key={String(project.id)}
                href={`/portal/${project.id}`}
                className="group grid min-h-24 grid-cols-[2.5rem_1fr_1rem] items-center gap-4 border-b border-[#233a30]/10 px-5 py-5 transition last:border-b-0 hover:bg-[#fafbf9] sm:grid-cols-[2.5rem_1fr_auto_1rem]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#233a30]/10 bg-[#f5f6f4] text-[#55725c]">
                  <FolderOpen size={19} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold leading-snug">
                    {projectDisplayName(
                      String(project.name),
                      Boolean(project.demo),
                    )}
                  </h3>
                  {!project.demo && (
                    <p className="mt-1 text-sm text-[#233a30]/65">
                      {String(project.organization_name)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-[#233a30]/75">
                    Updated {formatPortalDate(String(project.updated_at))}
                  </p>
                </div>
                <span className="hidden text-xs font-medium text-[#233a30]/75 sm:block">
                  Open project
                </span>
                <span className="text-[#233a30]/75 group-hover:text-[#233a30]">
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-[#779c69]/60 bg-white px-7 py-10">
            <FolderOpen
              size={30}
              strokeWidth={1.5}
              aria-hidden="true"
              className="text-[#779c69]"
            />
            <h3 className="mt-4 font-serif text-2xl">No projects here yet</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#233a30]/75">
              {admin
                ? "Create a project below to prepare its scope and documents."
                : "If you’re already working with PBI, contact us so we can verify and connect your account."}
            </p>
            {!admin && (
              <Link
                href="/contact"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
              >
                Contact PBI <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
      </section>

      {admin && (
        <details
          id="create-project"
          className="group scroll-mt-28 rounded-2xl border border-[#d8a45b]/50 bg-white px-6 py-6 sm:px-8"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 marker:hidden">
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#779c69]">
                Owner tools
              </span>
              <span className="mt-2 block font-serif text-2xl">
                Create a project
              </span>
              <span className="mt-1 block text-sm leading-6 text-[#233a30]/70">
                Enter project details or import validated JSON.
              </span>
            </span>
            <Plus
              size={22}
              aria-hidden="true"
              className="shrink-0 transition group-open:rotate-45"
            />
          </summary>
          <div className="mt-7 border-t border-[#d8a45b]/40 pt-2">
            <ProjectEditor initial={example} />
          </div>
        </details>
      )}
    </div>
  );
}
