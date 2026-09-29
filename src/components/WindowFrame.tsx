/**
 * Decorative browser-window chrome that frames the whole viewport.
 * echoing the arched-window motif of the Pierce Business Integrations logo.
 * Purely presentational; never intercepts pointer events.
 */
export default function WindowFrame() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-4 z-[60] hidden rounded-2xl border border-brass/40 lg:block"
    >
      {/* Title-bar divider */}
      <div className="absolute inset-x-0 top-10 h-px bg-brass/25 md:top-11" />

      {/* Traffic-light dots: subtle brass outlines that each light up into the
          classic macOS close/minimize/maximize colors when hovered individually.
          pointer-events re-enabled here since the frame is inert. */}
      <div className="pointer-events-auto absolute left-4 top-[13px] flex gap-2 md:left-5 md:top-4">
        <span className="h-2.5 w-2.5 rounded-full border border-brass/70 transition-all duration-300 hover:border-transparent hover:bg-[#FF5F57] hover:shadow-[0_0_7px_rgba(255,95,87,0.55)]" />
        <span className="h-2.5 w-2.5 rounded-full border border-brass/70 transition-all duration-300 hover:border-transparent hover:bg-[#FEBC2E] hover:shadow-[0_0_7px_rgba(254,188,46,0.55)]" />
        <span className="h-2.5 w-2.5 rounded-full border border-brass/70 transition-all duration-300 hover:border-transparent hover:bg-[#28C840] hover:shadow-[0_0_7px_rgba(40,200,64,0.55)]" />
      </div>
    </div>
  );
}
