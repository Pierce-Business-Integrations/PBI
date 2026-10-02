import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, FolderOpen, Plus } from "lucide-react";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isAdmin, portalActor } from "@/lib/portal/auth";
import { listProjects } from "@/lib/portal/repository";
import PortalActions from "./portal-actions";
import ProjectEditor from "./project-editor";

export const dynamic = "force-dynamic";

export default async function PortalHome() {
  const actor = await portalActor();
  if (!actor) redirect("/sign-in?redirect_url=%2Fportal");
  const projects = await listProjects(actor);
  const admin = await isAdmin(actor.userId);
  const example = admin
    ? JSON.parse(
        await readFile(
          join(process.cwd(), "docs", "client-portal", "example-project.json"),
          "utf8",
        ),
      )
    : null;

  return (
    <div className="space-y-9 lg:space-y-12">
      <header className="border-b border-[#233a30]/15 pb-9 sm:pb-11">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#55725c]">
          <span>
            {admin ? "Owner workspace" : "Client workspace"} / Overview
          </span>
          <span className="tabular-nums">
            {String(projects.length).padStart(2, "0")}{" "}
            {projects.length === 1 ? "project" : "projects"}
          </span>
        </div>
        <div className="mt-9 flex flex-wrap items-end justify-between gap-8 sm:mt-12">
          <div className="max-w-2xl">
            <h1 className="font-serif text-[clamp(3.25rem,6vw,5.5rem)] leading-[0.98] tracking-[-0.055em]">
              Your work,
              <br />
              <span className="text-[#778f73]">in one place.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#233a30]/68">
              A clear view of your projects and the documents, decisions, and
              next steps that move them forward.
            </p>
          </div>
          {projects.length > 0 && (
            <Link
              href={`/portal/${projects[0].id}`}
              className="group inline-flex min-h-12 items-center gap-3 border-b border-[#233a30] pb-1 text-sm font-semibold hover:text-[#567d50]"
            >
              Continue your work{" "}
              <ArrowUpRight
                size={18}
                aria-hidden="true"
                className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          )}
        </div>
      </header>

      {actor.simulated && (
        <aside
          className="border-l-[3px] border-[#d8a45b] bg-[#f1e9dc] px-5 py-4 text-sm sm:px-6"
          aria-label="Local demo notice"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[#233a30]">
                Local demo workspace
              </p>
              <p className="mt-1 leading-6 text-[#233a30]/75">
                Example identities and actions are simulated. No legal signature
                or charge occurs.
              </p>
            </div>
            <details className="group text-sm">
              <summary className="cursor-pointer font-semibold underline underline-offset-4">
                Switch demo identity
              </summary>
              <div className="pt-2">
                <PortalActions />
              </div>
            </details>
          </div>
        </aside>
      )}

      <section
        id="projects"
        aria-labelledby="projects-title"
        className="scroll-mt-28"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#567d50]">
              The work
            </p>
            <h2
              id="projects-title"
              className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl"
            >
              Projects
            </h2>
            <p className="mt-2 text-sm text-[#233a30]/70">
              Select a project to see its current details and documents.
            </p>
          </div>
          {admin && (
            <a
              href="#create-project"
              className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
            >
              <Plus size={16} aria-hidden="true" /> Create a project
            </a>
          )}
        </div>
        {projects.length ? (
          <div className="mt-6 overflow-hidden border-y border-[#233a30]/20 bg-white/70">
            {projects.map((project, index) => (
              <Link
                key={String(project.id)}
                href={`/portal/${project.id}`}
                className="group grid min-h-32 grid-cols-[2.5rem_1fr_2.5rem] items-center gap-4 border-b border-[#233a30]/10 px-5 py-6 transition last:border-b-0 hover:bg-[#f0eee7] sm:grid-cols-[4rem_1fr_auto_3rem] sm:gap-6 sm:px-8"
              >
                <span className="self-start pt-1 font-serif text-xl tabular-nums text-[#779c69] sm:self-center">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#567d50]">
                    {project.demo ? "Demo project" : "Client project"}
                  </span>
                  <h3 className="mt-2 font-serif text-2xl leading-snug tracking-tight sm:text-[2rem]">
                    {String(project.name)}
                  </h3>
                  <p className="mt-1 text-sm text-[#233a30]/65">
                    {String(project.organization_name)}
                  </p>
                </div>
                <span className="hidden text-sm font-medium text-[#233a30]/65 sm:block">
                  Open project
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#233a30]/20 transition group-hover:border-[#233a30] group-hover:bg-[#233a30] group-hover:text-white">
                  <ArrowUpRight size={18} aria-hidden="true" />
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
                Start with the labeled example, edit each field, or import
                validated JSON.
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
