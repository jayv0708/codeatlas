export default function RepositoriesLoading() {
  return (
    <div className="flex flex-col w-full relative h-full animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <div className="h-12 w-[350px] rounded-lg mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-4 w-[250px] rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div className="h-12 w-[180px] rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>

      {/* Repository Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <div className="flex-1">
                <div className="h-5 w-[150px] rounded mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="h-3 w-[100px] rounded" style={{ background: 'rgba(255,255,255,0.03)' }} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 w-full rounded" style={{ background: 'rgba(255,255,255,0.03)' }} />
              <div className="h-4 w-[80%] rounded" style={{ background: 'rgba(255,255,255,0.03)' }} />
            </div>
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between">
                <div className="h-6 w-[80px] rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="h-4 w-[60px] rounded" style={{ background: 'rgba(255,255,255,0.03)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
