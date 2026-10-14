export default function SettingsLoading() {
  return (
    <div className="flex flex-col w-full relative h-full animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-12 w-[250px] rounded-lg mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-4 w-[350px] rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {/* Profile Section */}
        <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="h-6 w-[150px] rounded mb-6" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="space-y-4">
            <div className="h-12 w-full rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
            <div className="h-12 w-full rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
          </div>
        </div>

        {/* GitHub Section */}
        <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="h-6 w-[180px] rounded mb-6" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <div className="flex-1">
                <div className="h-5 w-[200px] rounded mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="h-3 w-[150px] rounded" style={{ background: 'rgba(255,255,255,0.03)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* AI Section */}
        <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="h-6 w-[200px] rounded mb-6" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="space-y-4">
            <div className="h-12 w-full rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
            <div className="h-12 w-[60%] rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
