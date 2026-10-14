export default function ImpactLoading() {
  return (
    <div className="flex flex-col w-full relative h-full animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-10 w-[300px] rounded-lg mb-3" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-4 w-[400px] rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>

      {/* Query Input */}
      <div className="h-14 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />

      {/* Results */}
      <div className="space-y-6">
        {/* Impact Card */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-8 w-[100px] rounded-full" style={{ background: 'rgba(170,48,0,0.2)' }} />
            <div className="h-6 w-[200px] rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-full rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        </div>

        {/* Affected Components */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="h-6 w-[180px] rounded mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 w-full rounded" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
