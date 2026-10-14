export default function DashboardLoading() {
  return (
    <div
      className="min-h-screen flex"
      style={{
        background: "#0c0e12",
        color: "#e2e2e8",
        fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* Sidebar placeholder */}
      <aside
        className="hidden lg:flex w-[280px] flex-shrink-0 border-r flex-col h-screen fixed inset-y-0 left-0 z-50"
        style={{ background: "#0c0e12", borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-5 w-24 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        </div>
      </aside>

      {/* Main content placeholder */}
      <div className="flex-1 lg:ml-[280px] w-full min-h-screen relative isolate pb-32">
        {/* Header placeholder */}
        <header
          className="sticky top-0 z-20 flex h-16 items-center justify-between px-6 backdrop-blur-sm"
          style={{ background: "rgba(12,14,18,0.8)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="lg:hidden w-9 h-9 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="ml-auto flex items-center gap-4">
            <div className="h-8 w-8 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
        </header>

        {/* Content placeholders */}
        <main className="max-w-[1440px] mx-auto px-4 sm:px-8 w-full mt-8 sm:mt-12 md:mt-16">
          <div className="space-y-8">
            <div className="h-12 w-64 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              <div className="lg:col-span-8 rounded-2xl p-8 animate-pulse" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="h-8 w-48 rounded mb-4" style={{ background: "rgba(255,255,255,0.04)" }} />
                <div className="h-16 w-32 rounded mb-8" style={{ background: "rgba(255,255,255,0.04)" }} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
                  ))}
                </div>
              </div>
              <div className="lg:col-span-4 rounded-2xl p-8 animate-pulse" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="h-8 w-40 rounded mb-8" style={{ background: "rgba(255,255,255,0.04)" }} />
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
