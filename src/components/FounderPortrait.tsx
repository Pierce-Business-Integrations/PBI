import Image from "next/image";
import clsx from "clsx";

export default function FounderPortrait({ className }: { className?: string }) {
  return (
    <figure
      className={clsx(
        "pointer-events-none relative mx-auto w-full max-w-[460px] select-none",
        className,
      )}
    >
      <div className="relative pb-3 pr-3">
        <div
          className="absolute bottom-0 right-0 h-[calc(100%-0.75rem)] w-[calc(100%-0.75rem)] rounded-t-[999px] border border-brass/55"
          aria-hidden="true"
        />
        <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] border border-brass/40 bg-ivory-deep shadow-soft">
          <Image
            src="/images/jacob.png"
            alt="Jacob Pierce, founder of Pierce Business Integrations"
            fill
            sizes="(max-width: 640px) 86vw, 460px"
            quality={75}
            draggable={false}
            className="pointer-events-none origin-center scale-[1.2] select-none object-cover object-[58%_center]"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/25 via-transparent to-ivory/5"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-3 rounded-t-[999px] border border-ivory/45"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center gap-3 text-brass-light/80"
            aria-hidden="true"
          >
            <span className="h-px flex-1 bg-current" />
            <span className="text-[0.55rem]">◆</span>
            <span className="h-px flex-1 bg-current" />
          </div>
        </div>
      </div>
      <figcaption className="mt-4 flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-taupe">
        <span className="h-px w-8 bg-brass" aria-hidden="true" />
        Jacob Pierce · Founder
      </figcaption>
    </figure>
  );
}
