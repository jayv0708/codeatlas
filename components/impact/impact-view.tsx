"use client";

import { useState, useMemo } from "react";
import {
  Zap,
  Search,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

interface ImpactViewProps {
  repositories: Array<{ id: string; name: string; fullName: string | null }>;
  symbols: Array<{
    id: string;
    name: string;
    type: string;
    path: string;
    startLine: number;
    endLine: number;
    repoName: string;
  }>;
  dependencies: Array<{
    sourcePath: string;
    target: string;
    targetPath: string | null;
    kind: string;
  }>;
}

interface ImpactResult {
  component: string;
  impactLevel: "low" | "medium" | "high";
  directDeps: string[];
  indirectDeps: string[];
  affectedFiles: string[];
  evidence: string[];
}

export function ImpactView({
  symbols,
  dependencies,
}: ImpactViewProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ImpactResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Search symbols
  const filteredSymbols = useMemo(() => {
    if (!query) return symbols.slice(0, 20);
    return symbols
      .filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.path.toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, 20);
  }, [symbols, query]);

  const analyzeImpact = (symbol: (typeof symbols)[0]) => {
    setAnalyzing(true);
    setResult(null);

    // Simulate analysis delay
    setTimeout(() => {
      // Find direct dependencies (files that import this symbol's file)
      const directDeps = dependencies
        .filter((d) => d.target === symbol.path || d.targetPath === symbol.path)
        .map((d) => d.sourcePath);

      // Find indirect dependencies (files that depend on direct deps)
      const indirectDeps: string[] = [];
      for (const directDep of directDeps) {
        const indirect = dependencies
          .filter((d) => d.target === directDep || d.targetPath === directDep)
          .map((d) => d.sourcePath);
        indirectDeps.push(...indirect);
      }

      // Deduplicate
      const uniqueDirect = [...new Set(directDeps)];
      const uniqueIndirect = [...new Set(indirectDeps)].filter(
        (f) => !uniqueDirect.includes(f),
      );

      const affectedFiles = [...uniqueDirect, ...uniqueIndirect];

      // Determine impact level
      let impactLevel: "low" | "medium" | "high" = "low";
      if (affectedFiles.length > 10) {
        impactLevel = "high";
      } else if (affectedFiles.length > 3) {
        impactLevel = "medium";
      }

      const evidence = [
        `Component: ${symbol.name} (${symbol.type})`,
        `Location: ${symbol.path} lines ${symbol.startLine}-${symbol.endLine}`,
        `Direct dependents: ${uniqueDirect.length}`,
        `Indirect dependents: ${uniqueIndirect.length}`,
        `Total affected: ${affectedFiles.length}`,
      ];

      setResult({
        component: symbol.name,
        impactLevel,
        directDeps: uniqueDirect,
        indirectDeps: uniqueIndirect,
        affectedFiles,
        evidence,
      });

      setAnalyzing(false);
    }, 500);
  };

  const impactColor = (level: string) => {
    switch (level) {
      case "high":
        return "#e06d7b";
      case "medium":
        return "#ffb59e";
      case "low":
        return "#6dd5a0";
      default:
        return "#8b949e";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#f4f2eb" }}>
              Impact Analysis
            </h1>
            <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
              Understand what breaks when you change a component
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#8b949e" }}>
              {symbols.length} components
            </span>
            <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#8b949e" }}>
              {dependencies.length} dependencies
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Component search */}
        <div
          className="w-80 border-r overflow-y-auto"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="p-4">
            <div className="relative mb-4">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#8b949e" }}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search components..."
                className="w-full rounded-lg pl-9 pr-3 py-2 text-sm border outline-none"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)", color: "#f4f2eb" }}
              />
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8b949e" }}>
              Select Component ({filteredSymbols.length})
            </h3>

            <div className="space-y-1">
              {filteredSymbols.map((symbol) => (
                <button
                  key={symbol.id}
                  onClick={() => analyzeImpact(symbol)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
                  style={{ color: "#a3a19c" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate font-medium" style={{ color: "#f4f2eb" }}>
                      {symbol.name}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)" }}>
                      {symbol.type}
                    </span>
                  </div>
                  <div className="text-xs truncate mt-0.5" style={{ color: "#8b949e" }}>
                    {symbol.path}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="flex-1 p-6 overflow-y-auto">
          {analyzing ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mb-4" style={{ borderColor: "#ffb59e" }} />
              <p className="text-sm" style={{ color: "#8b949e" }}>Analyzing impact...</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Impact header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#f4f2eb" }}>
                    {result.component}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
                    Impact analysis results
                  </p>
                </div>
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-lg"
                  style={{ background: `${impactColor(result.impactLevel)}15`, border: `1px solid ${impactColor(result.impactLevel)}30` }}
                >
                  {result.impactLevel === "high" && <AlertTriangle size={16} style={{ color: impactColor(result.impactLevel) }} />}
                  {result.impactLevel === "medium" && <Zap size={16} style={{ color: impactColor(result.impactLevel) }} />}
                  {result.impactLevel === "low" && <CheckCircle size={16} style={{ color: impactColor(result.impactLevel) }} />}
                  <span className="font-semibold" style={{ color: impactColor(result.impactLevel) }}>
                    {result.impactLevel.toUpperCase()} IMPACT
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div
                  className="rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="text-2xl font-bold" style={{ color: "#ffb59e" }}>
                    {result.directDeps.length}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "#8b949e" }}>Direct Dependencies</div>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="text-2xl font-bold" style={{ color: "#7b9eff" }}>
                    {result.indirectDeps.length}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "#8b949e" }}>Indirect Dependencies</div>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="text-2xl font-bold" style={{ color: "#e06d7b" }}>
                    {result.affectedFiles.length}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "#8b949e" }}>Total Affected</div>
                </div>
              </div>

              {/* Direct dependencies */}
              {result.directDeps.length > 0 && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <h3 className="text-sm font-medium mb-3" style={{ color: "#f4f2eb" }}>
                    Direct Dependencies
                  </h3>
                  <div className="space-y-2">
                    {result.directDeps.map((dep) => (
                      <div
                        key={dep}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "#a3a19c" }}
                      >
                        <ArrowRight size={12} style={{ color: "#ffb59e" }} />
                        <span>{dep}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Indirect dependencies */}
              {result.indirectDeps.length > 0 && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <h3 className="text-sm font-medium mb-3" style={{ color: "#f4f2eb" }}>
                    Indirect Dependencies
                  </h3>
                  <div className="space-y-2">
                    {result.indirectDeps.map((dep) => (
                      <div
                        key={dep}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "#a3a19c" }}
                      >
                        <ArrowRight size={12} style={{ color: "#7b9eff" }} />
                        <span>{dep}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence */}
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(123,158,255,0.05)", border: "1px solid rgba(123,158,255,0.1)" }}
              >
                <h3 className="text-sm font-medium mb-2" style={{ color: "#7b9eff" }}>
                  Evidence
                </h3>
                <ul className="space-y-1">
                  {result.evidence.map((e, i) => (
                    <li key={i} className="text-xs" style={{ color: "#a3a19c" }}>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Zap size={48} style={{ color: "#8b949e" }} className="mb-4" />
              <h3 className="text-lg font-medium mb-2" style={{ color: "#f4f2eb" }}>
                Select a component
              </h3>
              <p className="text-sm max-w-md" style={{ color: "#8b949e" }}>
                Choose a component from the list to analyze its impact on the codebase.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
