export default function PortalLoading() {
  return (
    <div
      className="mx-auto max-w-6xl px-5 pb-20 pt-10 text-[#233a30]"
      role="status"
      aria-label="Loading your workspace"
    >
      <span className="sr-only">Loading your workspace…</span>
      <div className="h-4 w-28 rounded-full bg-[#779c69]/20 motion-safe:animate-pulse" />
      <div className="mt-8 rounded-[1.75rem] bg-[#233a30] p-8 sm:p-10">
        <div className="h-3 w-28 rounded-full bg-[#d8a45b]/50 motion-safe:animate-pulse" />
        <div className="mt-7 h-10 max-w-md rounded-lg bg-[#f9f3ed]/20 motion-safe:animate-pulse" />
        <div className="mt-5 h-4 max-w-xl rounded bg-[#f9f3ed]/15 motion-safe:animate-pulse" />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="h-44 rounded-2xl border border-[#d8a45b]/40 bg-white motion-safe:animate-pulse" />
        <div className="h-44 rounded-2xl border border-[#d8a45b]/40 bg-white motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
