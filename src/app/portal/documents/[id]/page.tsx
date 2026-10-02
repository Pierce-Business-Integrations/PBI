import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { portalActor } from "@/lib/portal/auth";
import { getPrivateFileInfo } from "@/lib/portal/repository";

export const dynamic = "force-dynamic";

export default async function PortalDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await portalActor();
  if (!actor)
    redirect(
      `/sign-in?redirect_url=${encodeURIComponent(`/portal/documents/${id}`)}`,
    );
  const file = await getPrivateFileInfo(actor, id);
  if (!file || file.mime_type !== "application/pdf") notFound();

  const filename = String(file.filename);
  const match = /^PBI-(proposal|agreement|invoice)-r(\d+)\.pdf$/i.exec(
    filename,
  );
  const title = match
    ? `${match[1][0].toUpperCase()}${match[1].slice(1)} · Version ${match[2]}`
    : filename.includes("completed")
      ? "Completed agreement"
      : "Project document";
  const fileUrl = `/api/portal/files/${id}`;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 text-[#233a30]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/portal/${file.project_id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to project
        </Link>
        <a
          href={fileUrl}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#233a30] px-5 py-2 text-sm font-semibold transition hover:bg-white"
        >
          <ArrowDownToLine size={16} aria-hidden="true" /> Download PDF
        </a>
      </div>

      <header className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#567d50]">
            <ShieldCheck size={16} aria-hidden="true" /> Private document
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#233a30]/70">
            Review this saved PDF in your workspace. You can return to the
            project or download a copy at any time.
          </p>
        </div>
      </header>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#d8a45b]/50 bg-white shadow-[0_20px_60px_-45px_rgba(35,58,48,0.45)]">
        <iframe
          src={`${fileUrl}?view=1`}
          title={`${title} PDF preview`}
          className="h-[75dvh] min-h-[520px] w-full"
        />
      </div>
      <p className="mt-4 text-sm text-[#233a30]/70">
        PDF not displaying in this browser?{" "}
        <a
          href={`${fileUrl}?view=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-[#233a30] underline underline-offset-4"
        >
          Open it in a new tab <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </p>
    </div>
  );
}
