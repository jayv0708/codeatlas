"use client";

import Link from "next/link";
import {
  Brain,
  FileCode,
  GitBranch,
  Layers,
  Clock,
  Shield,
  FolderTree,
  Lightbulb,
  TrendingUp,
} from "lucide-react";

interface InsightsViewProps {
  repositories: Array<{
    name: string;
    fullName: string;
    description: string | null;
    language: string | null;
    fileCount: number;
    symbolCount: number;
    dependencyCount: number;
  }>;
  largestFiles: Array<{
    path: string;
    size: number;
    language: string | null;
    repoName: string;
  }>;
  dependencyHotspots: Array<{
    path: string;
    dependencyCount: number;
  }>;
  fanInHotspots: Array<{
    path: string;
    dependentCount: number;
  }>;
  symbolTypes: Array<{
    type: string;
    count: number;
  }>;
  languages: Array<{
    language: string;
    count: number;
  }>;
  recentChanges: Array<{
    path: string;
    updatedAt: string;
    language: string | null;
    repoName: string;
  }>;
  frameworks: string[];
  appAreas: string[];
  healthSignals: string[];
  totalFiles: number;
  totalSymbols: number;
  totalDeps: number;
}

function InsightCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} style={{ color: "#ffb59e" }} />
        <h3 className="text-sm font-medium" style={{ color: "#f4f2eb" }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export function InsightsView({
  repositories,
  largestFiles,
  dependencyHotspots,
  fanInHotspots,
  symbolTypes,
  languages,
  recentChanges,
  frameworks,
  appAreas,
  healthSignals,
  totalFiles,
  totalSymbols,
  totalDeps,
}: InsightsViewProps) {
  if (repositories.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <div
          className="max-w-md text-center rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Brain size={48} style={{ color: "#8b949e" }} className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2" style={{ color: "#f4f2eb" }}>
            No indexed repositories
          </h2>
          <p className="text-sm mb-6" style={{ color: "#8b949e" }}>
            Connect and index a repository to see AI-powered insights about your codebase.
          </p>
          <Link
            href="/repositories"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
            style={{ background: "#ffb59e", color: "#0f111a" }}
          >
            <FileCode size={16} />
            Connect Repository
          </Link>
        </div>
      </div>
    );
  }

  const repo = repositories[0];
  const avgDepsPerFile = totalFiles > 0 ? (totalDeps / totalFiles).toFixed(1) : "0";

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#f4f2eb" }}>
          AI Insights
        </h1>
        <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
          Analytics and insights across your indexed repositories
        </p>
      </div>

      {/* About This Repository */}
      {repo && (
        <div
          className="rounded-xl p-6"
          style={{ background: "rgba(255,181,158,0.04)", border: "1px solid rgba(255,181,158,0.1)" }}
        >
          <h2 className="text-lg font-semibold mb-3" style={{ color: "#f4f2eb" }}>
            About {repo.name}
          </h2>
          {repo.description && (
            <p className="text-sm mb-4" style={{ color: "#a3a19c" }}>
              {repo.description}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {repo.language && (
              <div>
                <span style={{ color: "#8b949e" }}>Primary Language</span>
                <p className="font-medium mt-0.5" style={{ color: "#f4f2eb" }}>{repo.language}</p>
              </div>
            )}
            {frameworks.length > 0 && (
              <div>
                <span style={{ color: "#8b949e" }}>Technologies</span>
                <p className="font-medium mt-0.5" style={{ color: "#f4f2eb" }}>{frameworks.join(", ")}</p>
              </div>
            )}
            {appAreas.length > 0 && (
              <div>
                <span style={{ color: "#8b949e" }}>Application Areas</span>
                <p className="font-medium mt-0.5" style={{ color: "#f4f2eb" }}>{appAreas.join(", ")}</p>
              </div>
            )}
            <div>
              <span style={{ color: "#8b949e" }}>Codebase Size</span>
              <p className="font-medium mt-0.5" style={{ color: "#f4f2eb" }}>
                {totalFiles} files, {totalSymbols} symbols
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl p-4" style={{ background: "rgba(255,181,158,0.08)", border: "1px solid rgba(255,181,158,0.15)" }}>
          <div className="text-2xl font-bold" style={{ color: "#ffb59e" }}>{repositories.length}</div>
          <div className="text-xs mt-1" style={{ color: "#a3a19c" }}>Repositories</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "rgba(255,214,165,0.08)", border: "1px solid rgba(255,214,165,0.15)" }}>
          <div className="text-2xl font-bold" style={{ color: "#ffd6a5" }}>{totalFiles.toLocaleString()}</div>
          <div className="text-xs mt-1" style={{ color: "#a3a19c" }}>Files</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "rgba(109,213,160,0.08)", border: "1px solid rgba(109,213,160,0.15)" }}>
          <div className="text-2xl font-bold" style={{ color: "#6dd5a0" }}>{totalSymbols.toLocaleString()}</div>
          <div className="text-xs mt-1" style={{ color: "#a3a19c" }}>Symbols</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "rgba(224,109,123,0.08)", border: "1px solid rgba(224,109,123,0.15)" }}>
          <div className="text-2xl font-bold" style={{ color: "#e06d7b" }}>{totalDeps.toLocaleString()}</div>
          <div className="text-xs mt-1" style={{ color: "#a3a19c" }}>Dependencies</div>
        </div>
      </div>

      {/* Health Signals */}
      {healthSignals.length > 0 && (
        <InsightCard title="Repository Health" icon={Shield}>
          <div className="space-y-2">
            {healthSignals.map((signal, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm p-2 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <Lightbulb size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#ffd6a5" }} />
                <span style={{ color: "#a3a19c" }}>{signal}</span>
              </div>
            ))}
          </div>
        </InsightCard>
      )}

      {/* Insights grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Largest files */}
        <InsightCard title="Largest Files" icon={FileCode}>
          <div className="space-y-2">
            {largestFiles.map((file) => (
              <div key={file.path} className="flex items-center justify-between text-sm">
                <span className="truncate" style={{ color: "#a3a19c" }}>
                  {file.path.split("/").pop()}
                </span>
                <span className="text-xs" style={{ color: "#8b949e" }}>
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
        </InsightCard>

        {/* Dependency Hotspots (outgoing) */}
        <InsightCard title="Most Outgoing Dependencies" icon={GitBranch}>
          <div className="space-y-2">
            {dependencyHotspots.map((hotspot) => (
              <div key={hotspot.path} className="flex items-center justify-between text-sm">
                <span className="truncate" style={{ color: "#a3a19c" }}>
                  {hotspot.path.split("/").pop()}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,181,158,0.1)", color: "#ffb59e" }}>
                  {hotspot.dependencyCount} deps
                </span>
              </div>
            ))}
          </div>
        </InsightCard>

        {/* Most Used Files (fan-in) */}
        {fanInHotspots.length > 0 && (
          <InsightCard title="Most Used Files (Fan-in)" icon={TrendingUp}>
            <div className="space-y-2">
              {fanInHotspots.map((hotspot) => (
                <div key={hotspot.path} className="flex items-center justify-between text-sm">
                  <span className="truncate" style={{ color: "#a3a19c" }}>
                    {hotspot.path.split("/").pop()}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(109,213,160,0.1)", color: "#6dd5a0" }}>
                    {hotspot.dependentCount} imports
                  </span>
                </div>
              ))}
            </div>
          </InsightCard>
        )}

        {/* Language distribution */}
        <InsightCard title="Languages" icon={Layers}>
          <div className="space-y-2">
            {languages.map((lang) => {
              const percentage = totalFiles > 0 ? (lang.count / totalFiles) * 100 : 0;
              return (
                <div key={lang.language}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span style={{ color: "#a3a19c" }}>{lang.language}</span>
                    <span className="text-xs" style={{ color: "#8b949e" }}>
                      {lang.count} files ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percentage}%`, background: "#ffb59e" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </InsightCard>

        {/* Symbol types */}
        <InsightCard title="Symbol Types" icon={Brain}>
          <div className="space-y-2">
            {symbolTypes.map((st) => {
              const percentage = totalSymbols > 0 ? (st.count / totalSymbols) * 100 : 0;
              return (
                <div key={st.type}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span style={{ color: "#a3a19c" }}>{st.type}</span>
                    <span className="text-xs" style={{ color: "#8b949e" }}>
                      {st.count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percentage}%`, background: "#ffd6a5" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </InsightCard>

        {/* Repository Structure */}
        <InsightCard title="Repository Structure" icon={FolderTree}>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span style={{ color: "#a3a19c" }}>Avg dependencies per file</span>
              <span style={{ color: "#f4f2eb" }}>{avgDepsPerFile}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "#a3a19c" }}>Unique languages</span>
              <span style={{ color: "#f4f2eb" }}>{languages.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "#a3a19c" }}>Unique symbol types</span>
              <span style={{ color: "#f4f2eb" }}>{symbolTypes.length}</span>
            </div>
            {appAreas.length > 0 && (
              <div className="flex items-center justify-between">
                <span style={{ color: "#a3a19c" }}>Detected areas</span>
                <span style={{ color: "#f4f2eb" }}>{appAreas.length}</span>
              </div>
            )}
          </div>
        </InsightCard>
      </div>

      {/* Recent changes */}
      <InsightCard title="Recently Modified Files" icon={Clock}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {recentChanges.map((change) => (
            <div
              key={change.path}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div>
                <div className="text-sm font-medium" style={{ color: "#f4f2eb" }}>
                  {change.path.split("/").pop()}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#8b949e" }}>
                  {change.path}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs" style={{ color: "#8b949e" }}>
                  {new Date(change.updatedAt).toLocaleDateString()}
                </div>
                {change.language && (
                  <div className="text-xs mt-0.5" style={{ color: "#a3a19c" }}>
                    {change.language}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </InsightCard>
    </div>
  );
}
