import type { Metadata } from "next";

import { MobileNav, Sidebar } from "@/components/dashboard/dashboard-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { safeSession } from "@/lib/session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await safeSession();

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: '#0c0e12',
        fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
        color: '#e2e2e8',
      }}
    >
      <Sidebar />
      <div className="flex-1 lg:ml-[280px] w-full min-h-screen relative isolate pb-32">
        {/* Atmospheric Background Gradients */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px] mix-blend-plus-lighter opacity-60"
               style={{ background: 'rgba(170,48,0,0.05)' }} />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[100px] mix-blend-plus-lighter opacity-40"
               style={{ background: 'rgba(157,58,73,0.05)' }} />
          <div className="absolute inset-0 opacity-20 mix-blend-overlay"
               style={{
                 backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+")`,
               }}
          />
        </div>

        {/* Header */}
        <header
          className="sticky top-0 z-20 flex h-16 items-center justify-between px-6 backdrop-blur-sm"
          style={{
            borderColor: 'rgba(255,255,255,0.05)',
            background: 'rgba(12,14,18,0.8)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <MobileNav />
          <div className="ml-auto flex items-center gap-4">
            {session?.user ? (
              <UserMenu user={session.user} />
            ) : (
              <a
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'rgba(255,181,158,0.1)', color: '#ffb59e' }}
              >
                Sign In
              </a>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1440px] mx-auto px-4 sm:px-8 w-full mt-8 sm:mt-12 md:mt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
