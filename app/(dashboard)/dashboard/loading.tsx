export default function DashboardLoading() {
  return (
    <div className="flex flex-col w-full relative h-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <div className="h-16 md:h-24 w-[400px] rounded-lg mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="flex items-center gap-4">
            <div className="h-4 w-[300px] rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
        </div>
        <div className="h-12 w-[160px] rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
          {/* Main Card */}
          <div className="rounded-2xl p-6 md:p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="h-4 w-[200px] rounded mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="h-16 w-[150px] rounded mb-8" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
              ))}
            </div>
          </div>

          {/* Lower Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="h-6 w-[150px] rounded mb-8" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="h-6 w-[150px] rounded mb-8" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8">
          <div className="rounded-2xl p-6 md:p-8 flex-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="h-6 w-[180px] rounded mb-8" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-6 md:p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="h-4 w-[120px] rounded mb-6" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
