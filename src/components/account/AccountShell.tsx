import Link from "next/link";

export default function AccountShell({
  children,
  eyebrow,
  title,
  description,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-screen bg-[#f9f3ed] px-5 pb-20 pt-10 text-[#233a30] sm:pt-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d8a45b]/70 pb-6">
          <Link
            href="/clients"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-[#233a30] hover:text-[#779c69]"
          >
            ← Client access
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium underline underline-offset-4 hover:text-[#779c69]"
          >
            Need help? Contact us
          </Link>
        </div>
        <div className="mt-8 grid overflow-hidden rounded-2xl border border-[#d8a45b]/40 bg-white shadow-[0_24px_70px_-45px_rgba(35,58,48,0.45)] lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative flex flex-col justify-between bg-[#233a30] px-7 py-10 text-[#f9f3ed] sm:px-12 sm:py-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d8a45b]">
                {eyebrow}
              </p>
              <div className="mt-5 h-px w-16 bg-[#d8a45b]" aria-hidden="true" />
              <h1 className="mt-9 max-w-sm font-serif text-4xl leading-tight sm:text-5xl">
                {title}
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-[#f9f3ed]/85">
                {description}
              </p>
            </div>
            <p className="mt-14 border-t border-[#f9f3ed]/20 pt-5 text-xs font-medium uppercase tracking-[0.15em] text-[#d8a45b]">
              Modern solutions. Local partnership.
            </p>
          </div>
          <div className="flex min-h-[430px] items-center justify-center px-5 py-10 sm:px-10 lg:py-14">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
