export default function PortalLoading() {
  return (
    <div
      className="space-y-6 text-[#233a30]"
      role="status"
      aria-label="Loading your workspace"
    >
      <span className="sr-only">Loading your workspace…</span>
      <div className="h-4 w-28 rounded-full bg-[#779c69]/20 motion-safe:animate-pulse" />
      <div>
        <div className="h-8 max-w-sm rounded-lg bg-[#233a30]/10 motion-safe:animate-pulse" />
        <div className="mt-3 h-4 max-w-lg rounded bg-[#233a30]/5 motion-safe:animate-pulse" />
      </div>
      <div className="grid gap-4">
        <div className="h-72 rounded-xl border border-[#233a30]/15 bg-white motion-safe:animate-pulse" />
        <div className="h-36 rounded-xl border border-[#233a30]/15 bg-white motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
