export default function ChatLoading() {
  return (
    <div className="flex flex-col w-full relative h-full animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-10 w-[200px] rounded-lg mb-3" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-4 w-[300px] rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>

      {/* Chat Area */}
      <div className="flex-1 rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="space-y-6">
          {/* User message */}
          <div className="flex justify-end">
            <div className="h-12 w-[300px] rounded-xl" style={{ background: 'rgba(170,48,0,0.2)' }} />
          </div>
          {/* AI message */}
          <div className="flex justify-start">
            <div className="h-20 w-[400px] rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          {/* User message */}
          <div className="flex justify-end">
            <div className="h-10 w-[250px] rounded-xl" style={{ background: 'rgba(170,48,0,0.2)' }} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="mt-4 h-14 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
    </div>
  );
}
