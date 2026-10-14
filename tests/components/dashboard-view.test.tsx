import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardView } from "@/components/dashboard/dashboard-view";

const ZERO_STATS = { repositories: 0, aiInsights: 0, indexedFiles: 0, dependencies: 0 };

describe("DashboardView", () => {
  it("greets the signed-in user", () => {
    render(<DashboardView user={{ name: "Ada Lovelace" }} stats={ZERO_STATS} />);
    expect(screen.getByText(/welcome, ada/i)).toBeInTheDocument();
  });

  it("shows the Command Center heading", () => {
    render(<DashboardView user={{ name: "Ada" }} stats={ZERO_STATS} />);
    expect(screen.getByText(/command/i)).toBeInTheDocument();
    expect(screen.getByText(/center/i)).toBeInTheDocument();
  });

  it("shows repository stats", () => {
    render(<DashboardView user={{ name: "Ada" }} stats={ZERO_STATS} />);
    expect(screen.getByText("Total Indexed Codebase")).toBeInTheDocument();
    expect(screen.getByText("Files")).toBeInTheDocument();
  });

  it("shows Connect Repository button when no repos", () => {
    render(<DashboardView user={{ name: "Ada" }} stats={ZERO_STATS} repositories={[]} />);
    expect(screen.getByText("No repositories connected")).toBeInTheDocument();
  });

  it("shows connected repositories when available", () => {
    const repos = [
      {
        id: "1",
        name: "my-repo",
        fullName: "user/my-repo",
        description: "A test repo",
        defaultBranch: "main",
        language: "TypeScript",
        isPrivate: false,
        status: "INDEXED" as const,
        progress: 100,
        lastError: null,
        indexedAt: new Date().toISOString(),
        counts: { files: 42, symbols: 100, dependencies: 30 },
        job: null,
      },
    ];
    render(<DashboardView user={{ name: "Ada" }} stats={{ ...ZERO_STATS, repositories: 1 }} repositories={repos} />);
    expect(screen.getByText("my-repo")).toBeInTheDocument();
    expect(screen.getByText("user/my-repo")).toBeInTheDocument();
  });

  it("shows Atlas Intelligence section", () => {
    render(<DashboardView user={{ name: "Ada" }} stats={ZERO_STATS} />);
    expect(screen.getByText("Atlas Intelligence")).toBeInTheDocument();
  });

  it("defaults name to 'there' when user has no name", () => {
    render(<DashboardView user={{ name: null }} stats={ZERO_STATS} />);
    expect(screen.getByText(/welcome, there/i)).toBeInTheDocument();
  });

  it("shows Quick Actions links", () => {
    render(<DashboardView user={{ name: "Ada" }} stats={ZERO_STATS} />);
    expect(screen.getByText("Chat with AI")).toBeInTheDocument();
    expect(screen.getByText("Architecture")).toBeInTheDocument();
    expect(screen.getByText("Impact Analysis")).toBeInTheDocument();
    expect(screen.getByText("AI Insights")).toBeInTheDocument();
  });
});
