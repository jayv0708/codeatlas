"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  GitBranch,
  Search,
  ArrowRight,
  Layers,
  FileCode,
  Box,
  Cpu,
  Globe,
  Database,
  Puzzle,
  TestTube,
  Palette,
  Settings,
} from "lucide-react";

interface ArchitectureViewProps {
  repositories: Array<{
    id: string;
    name: string;
    fullName: string | null;
    language: string | null;
    description: string | null;
    fileCount: number;
    symbolCount: number;
    depCount: number;
  }>;
  dependencies: Array<{
    sourcePath: string;
    target: string;
    targetPath: string | null;
    kind: string;
    language: string | null;
  }>;
  symbols: Array<{
    name: string;
    type: string;
    startLine: number;
    endLine: number;
    path: string;
    language: string | null;
  }>;
  topDirs: Array<{ dir: string; fileCount: number }>;
  frameworks: string[];
  architecturePattern: string;
  appAreas: Record<string, boolean>;
  totalFiles: number;
}

const AREA_ICONS: Record<string, React.ElementType> = {
  hasComponents: Box,
  hasPages: Globe,
  hasApi: Cpu,
  hasServices: Database,
  hasTests: TestTube,
  hasUtils: Puzzle,
  hasStyles: Palette,
  hasConfig: Settings,
};

const AREA_LABELS: Record<string, string> = {
  hasComponents: "UI Components",
  hasPages: "Pages & Routes",
  hasApi: "API Layer",
  hasServices: "Services & Utilities",
  hasTests: "Tests",
  hasUtils: "Helpers & Utils",
  hasStyles: "Styles",
  hasConfig: "Configuration",
};

export function ArchitectureView({
  repositories,
  dependencies,
  symbols,
  topDirs,
  frameworks,
  architecturePattern,
  appAreas,
  totalFiles,
}: ArchitectureViewProps) {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Group dependencies by source file
  const dependencyGraph = useMemo(() => {
    const graph = new Map<string, Set<string>>();
    for (const dep of dependencies) {
      if (!graph.has(dep.sourcePath)) {
        graph.set(dep.sourcePath, new Set());
      }
      graph.get(dep.sourcePath)!.add(dep.target);
    }
    return graph;
  }, [dependencies]);

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    const nodes = Array.from(dependencyGraph.keys());
    if (!searchQuery) return nodes.slice(0, 50);
    return nodes
      .filter((n) => n.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 50);
  }, [dependencyGraph, searchQuery]);

  // Get related dependencies for selected node
  const relatedDeps = useMemo(() => {
    if (!selectedNode) return [];
    return dependencies.filter(
      (d) => d.sourcePath === selectedNode || d.target === selectedNode,
    );
  }, [selectedNode, dependencies]);

  const repo = repositories[0];

  if (repositories.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <div
          className="max-w-md text-center rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <GitBranch size={48} style={{ color: "#8b949e" }} className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2" style={{ color: "#f4f2eb" }}>
            No indexed repositories
          </h2>
          <p className="text-sm mb-6" style={{ color: "#8b949e" }}>
            Connect and index a repository to view its architecture and dependencies.
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

  const activeAreas = Object.entries(appAreas)
    .filter(([_, v]) => v)
    .map(([k]) => k);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#f4f2eb" }}>
              Architecture
            </h1>
            <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
              View dependencies and relationships between components
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#8b949e" }}>
              {dependencies.length} dependencies
            </span>
            <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#8b949e" }}>
              {symbols.length} symbols
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Repository selector */}
          <select
            value={selectedRepo ?? ""}
            onChange={(e) => setSelectedRepo(e.target.value || null)}
            className="rounded-lg px-3 py-2 text-sm border outline-none"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)", color: "#f4f2eb" }}
          >
            <option value="">All repositories</option>
            {repositories.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#8b949e" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components..."
              className="w-full rounded-lg pl-9 pr-3 py-2 text-sm border outline-none"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)", color: "#f4f2eb" }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Dependency list + Overview */}
        <div
          className="w-full md:w-80 border-b md:border-b-0 md:border-r overflow-y-auto max-h-[40vh] md:max-h-none"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          {/* Repository Overview */}
          {repo && (
            <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#8b949e" }}>
                Repository Overview
              </h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span style={{ color: "#a3a19c" }}>Name</span>
                  <span style={{ color: "#f4f2eb" }}>{repo.name}</span>
                </div>
                {repo.language && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: "#a3a19c" }}>Language</span>
                    <span style={{ color: "#f4f2eb" }}>{repo.language}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span style={{ color: "#a3a19c" }}>Files</span>
                  <span style={{ color: "#f4f2eb" }}>{repo.fileCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "#a3a19c" }}>Symbols</span>
                  <span style={{ color: "#f4f2eb" }}>{repo.symbolCount}</span>
                </div>
                {frameworks.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: "#a3a19c" }}>Tech</span>
                    <span style={{ color: "#f4f2eb" }}>{frameworks.join(", ")}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 p-2 rounded-lg text-xs" style={{ background: "rgba(255,181,158,0.06)", color: "#ffb59e" }}>
                {architecturePattern}
              </div>
            </div>
          )}

          {/* Directory Structure */}
          {topDirs.length > 0 && (
            <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#8b949e" }}>
                Directory Structure
              </h3>
              <div className="space-y-1">
                {topDirs.map((d) => (
                  <div key={d.dir} className="flex items-center justify-between text-xs">
                    <span style={{ color: "#a3a19c" }}>{d.dir}</span>
                    <span style={{ color: "#8b949e" }}>{d.fileCount} files</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application Areas */}
          {activeAreas.length > 0 && (
            <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#8b949e" }}>
                Application Areas
              </h3>
              <div className="space-y-1">
                {activeAreas.map((area) => {
                  const Icon = AREA_ICONS[area] ?? Box;
                  return (
                    <div key={area} className="flex items-center gap-2 text-xs">
                      <Icon size={12} style={{ color: "#ffb59e" }} />
                      <span style={{ color: "#a3a19c" }}>{AREA_LABELS[area] ?? area}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Component list */}
          <div className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8b949e" }}>
              Components ({filteredNodes.length})
            </h3>
            <div className="space-y-1">
              {filteredNodes.map((node) => {
                const depCount = dependencyGraph.get(node)?.size ?? 0;
                const isSelected = selectedNode === node;
                return (
                  <button
                    key={node}
                    onClick={() => setSelectedNode(isSelected ? null : node)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      background: isSelected ? "rgba(255,181,158,0.1)" : "transparent",
                      color: isSelected ? "#ffb59e" : "#a3a19c",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{node.split("/").pop()}</span>
                      <span className="text-xs" style={{ color: "#8b949e" }}>
                        {depCount}
                      </span>
                    </div>
                    <div className="text-xs truncate mt-0.5" style={{ color: "#8b949e" }}>
                      {node}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "#f4f2eb" }}>
                  {selectedNode.split("/").pop()}
                </h2>
                <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
                  {selectedNode}
                </p>
              </div>

              {/* Outgoing dependencies */}
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <h3 className="text-sm font-medium mb-3" style={{ color: "#f4f2eb" }}>
                  Depends on ({dependencyGraph.get(selectedNode)?.size ?? 0})
                </h3>
                <div className="space-y-2">
                  {Array.from(dependencyGraph.get(selectedNode) ?? []).map((target) => (
                    <div
                      key={target}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "#a3a19c" }}
                    >
                      <ArrowRight size={12} style={{ color: "#ffb59e" }} />
                      <span>{target}</span>
                    </div>
                  ))}
                  {dependencyGraph.get(selectedNode)?.size === 0 && (
                    <p className="text-sm" style={{ color: "#8b949e" }}>
                      No dependencies found
                    </p>
                  )}
                </div>
              </div>

              {/* Incoming dependencies */}
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <h3 className="text-sm font-medium mb-3" style={{ color: "#f4f2eb" }}>
                  Used by ({relatedDeps.filter((d) => d.target === selectedNode).length})
                </h3>
                <div className="space-y-2">
                  {relatedDeps
                    .filter((d) => d.target === selectedNode)
                    .map((d) => (
                      <div
                        key={d.sourcePath}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "#a3a19c" }}
                      >
                        <ArrowRight size={12} style={{ color: "#ffd6a5" }} />
                        <span>{d.sourcePath}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Symbols in this file */}
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <h3 className="text-sm font-medium mb-3" style={{ color: "#f4f2eb" }}>
                  Symbols
                </h3>
                <div className="space-y-2">
                  {symbols
                    .filter((s) => s.path === selectedNode)
                    .map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span style={{ color: "#a3a19c" }}>{s.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#8b949e" }}>
                          {s.type} · lines {s.startLine}-{s.endLine}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Layers size={48} style={{ color: "#8b949e" }} className="mb-4" />
              <h3 className="text-lg font-medium mb-2" style={{ color: "#f4f2eb" }}>
                Select a component
              </h3>
              <p className="text-sm max-w-md" style={{ color: "#8b949e" }}>
                Click on a component from the list to view its dependencies, dependents, and symbols.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
