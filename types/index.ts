import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
}

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface DashboardStats {
  repositories: number;
  aiInsights: number;
  indexedFiles: number;
  dependencies: number;
}

export interface StatCardData {
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
}

/** Cookie consent state. `necessary` is always true (auth/security cookies). */
export interface Consent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

export type RepositoryStatus = "NOT_CONNECTED" | "QUEUED" | "INDEXING" | "INDEXED" | "FAILED";

export interface RepositoryJob {
  id: string;
  status: string;
  stage: string | null;
  progress: number;
  error: string | null;
  totalFiles: number;
  filesProcessed: number;
}

export interface RepositorySummary {
  id: string;
  name: string;
  fullName: string | null;
  description: string | null;
  defaultBranch: string | null;
  language: string | null;
  isPrivate: boolean;
  status: RepositoryStatus;
  progress: number;
  lastError: string | null;
  indexedAt: string | null;
  counts: {
    files: number;
    symbols: number;
    dependencies: number;
  };
  job: RepositoryJob | null;
}

export interface RepositoryDetail extends RepositorySummary {
  createdAt: string;
  languages: { language: string | null; count: number }[];
  symbolTypes: { type: string; count: number }[];
  topSymbols: { name: string; type: string; startLine: number; path: string }[];
}

export interface GitHubRepoOption {
  id: number;
  fullName: string;
  name: string;
  description: string | null;
  defaultBranch: string | null;
  language: string | null;
  isPrivate: boolean;
  sizeKb: number;
  connected: boolean;
}
