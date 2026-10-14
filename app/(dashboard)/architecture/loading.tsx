export default function ArchitectureLoading() {
  return (
    <div className="flex flex-col w-full relative h-full animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-10 w-[280px] rounded-lg mb-3" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-4 w-[350px] rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>

      {/* Architecture Graph Area */}
      <div className="flex-1 rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            {/* Nodes */}
            <div className="flex gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-24 h-24 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
              ))}
            </div>
            {/* Lines */}
            <div className="w-[300px] h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="flex gap-12">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="w-20 h-20 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
        ))}
      </div>
    </div>
  );
}
