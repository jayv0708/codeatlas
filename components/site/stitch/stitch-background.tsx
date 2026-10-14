/**
 * Fixed background effects from the Stitch marketing reference.
 * Rendered once in the marketing layout, behind all marketing content.
 */
export function StitchBackground() {
  return (
    <>
      <div className="fixed inset-0 z-[-3] bg-[#0c0d12]" aria-hidden="true" />
      <div
        className="fixed inset-0 z-[-2] pointer-events-none opacity-80 mix-blend-screen overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-[-20%] left-[-10%] w-[150%] h-[150%] bg-beam rotate-[-15deg] blur-3xl opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[100%] bg-[radial-gradient(circle_at_center,rgba(255,181,158,0.15)_0%,transparent_60%)] blur-3xl mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background/90" />
      </div>
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-30" aria-hidden="true" />
      <div
        className="fixed inset-0 z-[-1] pointer-events-none scanlines opacity-50 mix-blend-overlay"
        aria-hidden="true"
      />
    </>
  );
}
