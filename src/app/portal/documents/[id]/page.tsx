import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowDownToLine, ArrowLeft, ArrowUpRight } from "lucide-react";
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
    <div className="space-y-6">
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

      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold leading-tight sm:text-[32px]">
            {title}
          </h1>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-[#233a30]/15 bg-white">
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
