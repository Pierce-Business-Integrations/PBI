export default function AccountLoading() {
  return (
    <div
      className="mx-auto max-w-5xl px-5 pb-20 pt-10 text-[#233a30]"
      role="status"
      aria-label="Loading your account"
    >
      <span className="sr-only">Loading your account…</span>
      <div className="h-4 w-32 rounded-full bg-[#779c69]/20 motion-safe:animate-pulse" />
      <div className="mt-12 h-12 max-w-lg rounded-lg bg-[#233a30]/10 motion-safe:animate-pulse" />
      <div className="mt-5 h-4 max-w-sm rounded bg-[#233a30]/10 motion-safe:animate-pulse" />
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="h-52 rounded-2xl bg-[#233a30]/85 motion-safe:animate-pulse" />
        <div className="h-52 rounded-2xl border border-[#d8a45b]/40 bg-white motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
