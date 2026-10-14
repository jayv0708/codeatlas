import Link from "next/link";
import {
  GitBranch,
  FileCode,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  GitFork,
  FolderGit2,
  ArrowRight,
  Zap,
} from "lucide-react";
import { ConnectRepositoryDialog } from "@/components/repositories/connect-repository-dialog";
import { RepositoryStatusBadge } from "@/components/repositories/repository-status-badge";
import type { DashboardStats, RepositorySummary } from "@/types";

interface DashboardViewProps {
  user: {
    name?: string | null;
  };
  stats: DashboardStats;
  repositories?: RepositorySummary[];
}

export function DashboardView({ user, stats, repositories = [] }: DashboardViewProps) {
  const firstName = user.name?.split(/\s+/)[0] ?? "there";
  const hasRepos = repositories.length > 0;
  const indexedCount = repositories.filter((r) => r.status === "INDEXED").length;
  const totalCount = stats.repositories;

  return (
    <div className="flex flex-col w-full relative h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <h1 className="text-4xl md:text-8xl font-bold tracking-tighter mb-4 text-white leading-none"
              style={{ letterSpacing: '-0.04em' }}>
            Command<br />Center
          </h1>
          <div className="flex items-center gap-4 font-mono text-sm" style={{ color: '#8b949e' }}>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(170,48,0,0.8)', boxShadow: '0 0 8px rgba(170,48,0,0.6)' }} />
              Welcome, {firstName}
            </span>
            <span style={{ color: 'rgba(139,148,158,0.5)' }}>/</span>
            <span>System Online</span>
            <span style={{ color: 'rgba(139,148,158,0.5)' }}>/</span>
            <span>v2.4.1</span>
          </div>
        </div>
        <div className="flex gap-4">
          <ConnectRepositoryDialog />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Primary Metrics (Col span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
          {/* System Health Card */}
          <div className="rounded-2xl p-6 md:p-8 flex flex-col relative overflow-hidden group"
               style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                 style={{ background: 'linear-gradient(to bottom right, rgba(170,48,0,0.05), transparent, transparent)' }} />
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: '#8b949e' }}>
                  Total Indexed Codebase
                </p>
                <div className="flex items-baseline gap-4">
                  <h2 className="text-5xl md:text-8xl font-bold text-white m-0 leading-none">{stats.indexedFiles.toLocaleString()}</h2>
                  <span className="font-mono text-sm" style={{ color: '#8b949e' }}>Files</span>
                </div>
              </div>
            </div>

            {/* System Health Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto relative z-10">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(170,48,0,0.1)', border: '1px solid rgba(170,48,0,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={14} style={{ color: '#aa3000' }} />
                  <span className="font-mono text-xs" style={{ color: '#aa3000' }}>Repos</span>
                </div>
                <div className="text-white font-medium">{stats.repositories}</div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(123,158,255,0.1)', border: '1px solid rgba(123,158,255,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <FileCode size={14} style={{ color: '#7b9eff' }} />
                  <span className="font-mono text-xs" style={{ color: '#7b9eff' }}>Indexed</span>
                </div>
                <div className="text-white font-medium">{indexedCount}</div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(224,109,123,0.1)', border: '1px solid rgba(224,109,123,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} style={{ color: '#e06d7b' }} />
                  <span className="font-mono text-xs" style={{ color: '#e06d7b' }}>Dependencies</span>
                </div>
                <div className="text-white font-medium">{stats.dependencies.toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,181,158,0.1)', border: '1px solid rgba(255,181,158,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} style={{ color: '#ffb59e' }} />
                  <span className="font-mono text-xs" style={{ color: '#ffb59e' }}>Insights</span>
                </div>
                <div className="text-white font-medium">{stats.aiInsights}</div>
              </div>
            </div>
          </div>

          {/* Lower Grid: Connections & Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Connected Repositories */}
            <div className="rounded-2xl p-8 transition-colors"
                 style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white m-0">Repositories</h3>
                <FolderGit2 size={20} style={{ color: '#8b949e' }} />
              </div>

              {hasRepos ? (
                <div className="flex flex-col gap-3">
                  {repositories.slice(0, 3).map((repo) => (
                    <Link
                      key={repo.id}
                      href={`/repositories/${repo.id}`}
                      className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-white/5"
                      style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-white">{repo.name}</p>
                          <RepositoryStatusBadge status={repo.status} />
                        </div>
                        <p className="truncate text-xs mt-0.5" style={{ color: '#8b949e' }}>
                          {repo.fullName}
                        </p>
                      </div>
                      <ArrowRight size={14} style={{ color: '#8b949e' }} className="flex-shrink-0 ml-2" />
                    </Link>
                  ))}
                  {totalCount > 3 && (
                    <Link href="/repositories" className="font-mono text-xs text-center py-2" style={{ color: '#aa3000' }}>
                      View all {totalCount} repositories →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                       style={{ background: 'rgba(255,181,158,0.1)', border: '1px solid rgba(255,181,158,0.15)' }}>
                    <GitFork size={28} style={{ color: '#ffb59e' }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white mb-1">No repositories connected</p>
                    <p className="text-xs" style={{ color: '#8b949e' }}>
                      Connect a GitHub repository to start indexing your codebase.
                    </p>
                  </div>
                  <ConnectRepositoryDialog />
                </div>
              )}

              <Link href="/repositories"
                    className="w-full mt-4 py-3 rounded-lg font-mono flex items-center justify-center gap-2 transition-colors"
                    style={{ border: '2px dashed rgba(255,255,255,0.2)', color: '#8b949e' }}>
                <span className="text-sm">+ Add Repository</span>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl p-8 transition-colors"
                 style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-semibold text-white m-0">Quick Actions</h3>
                <Zap size={20} style={{ color: '#8b949e' }} />
              </div>
              <div className="flex flex-col gap-4">
                <Link href="/chat"
                      className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-white/5"
                      style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                       style={{ background: 'rgba(170,48,0,0.1)', border: '1px solid rgba(170,48,0,0.2)' }}>
                    <MessageSquare size={20} style={{ color: '#aa3000' }} />
                  </div>
                  <div>
                    <div className="font-medium text-white">Chat with AI</div>
                    <div className="text-xs" style={{ color: '#8b949e' }}>Ask questions about your codebase</div>
                  </div>
                </Link>

                <Link href="/architecture"
                      className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-white/5"
                      style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                       style={{ background: 'rgba(123,158,255,0.1)', border: '1px solid rgba(123,158,255,0.2)' }}>
                    <GitBranch size={20} style={{ color: '#7b9eff' }} />
                  </div>
                  <div>
                    <div className="font-medium text-white">Architecture</div>
                    <div className="text-xs" style={{ color: '#8b949e' }}>View dependency graph</div>
                  </div>
                </Link>

                <Link href="/impact"
                      className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-white/5"
                      style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                       style={{ background: 'rgba(224,109,123,0.1)', border: '1px solid rgba(224,109,123,0.2)' }}>
                    <Shield size={20} style={{ color: '#e06d7b' }} />
                  </div>
                  <div>
                    <div className="font-medium text-white">Impact Analysis</div>
                    <div className="text-xs" style={{ color: '#8b949e' }}>Analyze change impact</div>
                  </div>
                </Link>

                <Link href="/ai-insights"
                      className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-white/5"
                      style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                       style={{ background: 'rgba(255,181,158,0.1)', border: '1px solid rgba(255,181,158,0.2)' }}>
                    <TrendingUp size={20} style={{ color: '#ffb59e' }} />
                  </div>
                  <div>
                    <div className="font-medium text-white">AI Insights</div>
                    <div className="text-xs" style={{ color: '#8b949e' }}>Discover codebase patterns</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Feeds & Insights (Col span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8">
          {/* AI Insights Card */}
          <div className="rounded-2xl p-6 md:p-8 flex-1 flex flex-col"
               style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold text-white m-0">Atlas Intelligence</h3>
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                   style={{ background: 'rgba(170,48,0,0.1)', border: '1px solid rgba(170,48,0,0.2)' }}>
                <Shield size={14} style={{ color: '#aa3000' }} />
              </div>
            </div>
            <div className="flex flex-col gap-6">
              {/* Insight Item 1 */}
              <div className="relative pl-6" style={{ borderLeft: '2px solid #aa3000' }}>
                <div className="absolute w-2 h-2 rounded-full"
                     style={{ left: '-5px', top: '6px', background: '#aa3000', boxShadow: '0 0 8px rgba(170,48,0,0.8)' }} />
                <div className="font-mono text-xs mb-1 uppercase tracking-widest" style={{ color: '#aa3000' }}>Architecture Risk</div>
                <div className="text-sm leading-tight mb-2" style={{ color: '#e2e2e8' }}>
                  Circular dependency detected between <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.1)' }}>AuthService</code> and <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.1)' }}>UserService</code>.
                </div>
                <Link href="/architecture" className="font-mono text-xs flex items-center gap-1 transition-colors" style={{ color: '#8b949e' }}>
                  Review trace →
                </Link>
              </div>

              {/* Insight Item 2 */}
              <div className="relative pl-6" style={{ borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                <div className="absolute w-2 h-2 rounded-full" style={{ left: '-5px', top: '6px', background: 'rgba(255,255,255,0.2)' }} />
                <div className="font-mono text-xs mb-1 uppercase tracking-widest" style={{ color: '#8b949e' }}>Optimization</div>
                <div className="text-sm leading-tight mb-2" style={{ color: '#e2e2e8' }}>
                  Database query in <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.1)' }}>getProductCatalog()</code> lacks index utilization.
                </div>
                <Link href="/impact" className="font-mono text-xs flex items-center gap-1 transition-colors" style={{ color: '#8b949e' }}>
                  View plan →
                </Link>
              </div>

              {/* Insight Item 3 */}
              <div className="relative pl-6" style={{ borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                <div className="absolute w-2 h-2 rounded-full" style={{ left: '-5px', top: '6px', background: 'rgba(255,255,255,0.2)' }} />
                <div className="font-mono text-xs mb-1 uppercase tracking-widest" style={{ color: '#9d3a49' }}>Security Advisory</div>
                <div className="text-sm leading-tight mb-2" style={{ color: '#e2e2e8' }}>
                  Outdated dependency <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.1)' }}>lodash &lt; 4.17.21</code> found.
                </div>
                <Link href="/ai-insights" className="font-mono text-xs flex items-center gap-1 transition-colors" style={{ color: '#8b949e' }}>
                  Generate patch →
                </Link>
              </div>
            </div>
            <Link href="/ai-insights"
                  className="mt-auto pt-6 font-mono text-sm w-full text-left flex items-center justify-between border-t transition-colors group"
                  style={{ color: '#aa3000', borderColor: 'rgba(255,255,255,0.05)' }}>
              View All Insights
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {/* Dependencies count */}
          <div className="rounded-2xl p-6"
               style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: '#8b949e' }}>Dependencies</p>
                <h3 className="text-3xl font-bold text-white">{stats.dependencies.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                   style={{ background: 'rgba(123,158,255,0.1)' }}>
                <GitBranch size={20} style={{ color: '#7b9eff' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
