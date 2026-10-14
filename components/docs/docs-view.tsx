"use client";

import { useState } from "react";
import {
  BookOpen,
  Rocket,
  FolderGit2,
  MessageSquare,
  GitBranch,
  Zap,
  Brain,
  Shield,
  Copy,
  Check,
} from "lucide-react";

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: string;
  code?: string;
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    content: `CodeAtlas is an AI-powered codebase intelligence platform that helps you understand your software systems.

### Quick Start

1. **Sign In** — Use GitHub or Google OAuth to authenticate
2. **Connect Repository** — Select a GitHub repository to index
3. **Wait for Indexing** — CodeAtlas parses your code, extracts symbols, and maps dependencies
4. **Start Exploring** — Use Chat, Architecture, Impact Analysis, and AI Insights

### What CodeAtlas Does

- **Indexes** your source code and documentation
- **Extracts** symbols (classes, functions, interfaces)
- **Maps** file-to-file dependencies
- **Generates** embeddings for semantic search
- **Answers** questions about your codebase using AI`,
  },
  {
    id: "repository-setup",
    title: "Repository Setup",
    icon: FolderGit2,
    content: `### Connecting a Repository

1. Go to **Repositories** in the sidebar
2. Click **Connect GitHub Repository**
3. Select a repository from the list
4. CodeAtlas will begin indexing automatically

### Requirements

- GitHub account connected with \`repo\` scope
- Repository must be accessible to your GitHub account
- Repository should not be excessively large (>100MB)

### What Gets Indexed

- Source code files (JavaScript, TypeScript, Python, Go, Java, etc.)
- Documentation files (Markdown, text)
- Configuration files

### What Gets Ignored

- node_modules, .git, .next, dist, build
- Binary files, images, compiled assets
- Generated files`,
    code: `# Repository states:
NOT_CONNECTED → QUEUED → INDEXING → INDEXED
                                  → FAILED`,
  },
  {
    id: "codebase-chat",
    title: "Codebase Chat",
    icon: MessageSquare,
    content: `### Using Chat

The Chat feature lets you ask natural-language questions about your codebase.

### Example Questions

- "How does authentication work?"
- "Where is the database connection created?"
- "Which files handle user registration?"
- "What does UserService do?"
- "How does the API reach PostgreSQL?"
- "What depends on this component?"

### How It Works

1. Your question is analyzed
2. Relevant code chunks are retrieved using vector search
3. Context is built from the most relevant files
4. AI generates an answer with evidence citations

### Tips

- Be specific about what you're looking for
- Reference component or file names when possible
- Ask follow-up questions for deeper exploration`,
  },
  {
    id: "architecture",
    title: "Architecture",
    icon: GitBranch,
    content: `### Viewing Architecture

The Architecture page shows the relationships between components in your codebase.

### Features

- **Dependency Graph** — See which files depend on which
- **Component Details** — View dependencies, dependents, and symbols
- **Search** — Find specific components quickly
- **Language Filter** — Filter by programming language

### Understanding Dependencies

- **Direct Dependencies** — Files that directly import from this component
- **Indirect Dependencies** — Files that depend on files that depend on this component
- **Dependency Hotspots** — Files with the most dependencies (potential refactoring targets)`,
  },
  {
    id: "impact-analysis",
    title: "Impact Analysis",
    icon: Zap,
    content: `### Analyzing Impact

Impact Analysis helps you understand what breaks when you change a component.

### How to Use

1. Go to **Impact Analysis** in the sidebar
2. Search for a component (class, function, or interface)
3. Click on the component to analyze its impact
4. Review the impact level and affected files

### Impact Levels

- **Low** — Few dependents, safe to change
- **Medium** — Moderate dependents, review before changing
- **High** — Many dependents, thorough review required

### What's Analyzed

- Direct dependents (files that import this component)
- Indirect dependents (files that depend on direct dependents)
- API endpoints that might be affected
- Test files where available`,
  },
  {
    id: "ai-features",
    title: "AI Features",
    icon: Brain,
    content: `### AI-Powered Insights

CodeAtlas uses AI to provide intelligent analysis of your codebase.

### Features

- **Codebase Chat** — Ask questions about your code
- **Architecture Analysis** — Understand component relationships
- **Impact Analysis** — Know what breaks when you change things
- **Dependency Intelligence** — Trace data flows through your stack
- **Git Intelligence** — Understand code evolution over time

### How AI Works

1. **Retrieval** — Relevant code is retrieved using vector search
2. **Context Building** — Evidence is assembled within token limits
3. **Generation** — AI generates answers based on actual code
4. **Citation** — Answers include file paths and line ranges

### Accuracy

- AI responses are based on actual repository data
- Evidence citations show exactly where information came from
- If evidence is insufficient, AI will say so rather than guessing`,
  },
  {
    id: "security",
    title: "Security",
    icon: Shield,
    content: `### Security Overview

CodeAtlas is designed with security as a priority.

### Authentication

- OAuth 2.0 via GitHub and Google
- Database-backed sessions (not JWT)
- Automatic session expiration

### Authorization

- Every API request is authenticated
- Repository access is verified per-user
- Users can only access their own repositories

### Data Protection

- API keys stored server-side only
- No secrets exposed to the browser
- Rate limiting on API endpoints
- Input validation on all endpoints

### Repository Access

- Minimum required GitHub scopes
- Read-only access to repositories
- No write operations on your code
- Tokens are never logged or exposed`,
  },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-4 rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="text-xs" style={{ color: "#8b949e" }}>Code</span>
        <button onClick={copy} className="text-xs flex items-center gap-1" style={{ color: "#8b949e" }}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto" style={{ color: "#a3a19c" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function DocsView() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const currentSection = DOC_SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className="w-64 border-r overflow-y-auto p-4"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={18} style={{ color: "#ffb59e" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#f4f2eb" }}>
              Documentation
            </h2>
          </div>
          <p className="text-xs" style={{ color: "#8b949e" }}>
            Learn how to use CodeAtlas
          </p>
        </div>

        <nav className="space-y-1">
          {DOC_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left"
                style={{
                  background: isActive ? "rgba(255,181,158,0.1)" : "transparent",
                  color: isActive ? "#ffb59e" : "#a3a19c",
                }}
              >
                <Icon size={16} />
                <span>{section.title}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {currentSection && (
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              {(() => {
                const Icon = currentSection.icon;
                return <Icon size={24} style={{ color: "#ffb59e" }} />;
              })()}
              <h1 className="text-2xl font-bold" style={{ color: "#f4f2eb" }}>
                {currentSection.title}
              </h1>
            </div>

            <div
              className="prose prose-invert max-w-none"
              style={{ color: "#a3a19c" }}
            >
              {currentSection.content.split("\n").map((paragraph, i) => {
                if (paragraph.startsWith("### ")) {
                  return (
                    <h3 key={i} className="text-lg font-semibold mt-6 mb-3" style={{ color: "#f4f2eb" }}>
                      {paragraph.replace("### ", "")}
                    </h3>
                  );
                }
                if (paragraph.startsWith("- ")) {
                  return (
                    <div key={i} className="flex items-start gap-2 mb-2 ml-4">
                      <span style={{ color: "#ffb59e" }}>•</span>
                      <span>{paragraph.replace("- ", "")}</span>
                    </div>
                  );
                }
                if (paragraph.startsWith("1. ") || paragraph.startsWith("2. ") || paragraph.startsWith("3. ") || paragraph.startsWith("4. ")) {
                  return (
                    <div key={i} className="flex items-start gap-2 mb-2 ml-4">
                      <span className="font-mono text-xs" style={{ color: "#ffb59e" }}>
                        {paragraph.match(/^\d+/)?.[0]}.
                      </span>
                      <span>{paragraph.replace(/^\d+\.\s*/, "")}</span>
                    </div>
                  );
                }
                if (paragraph.trim() === "") {
                  return <div key={i} className="h-3" />;
                }
                return <p key={i} className="mb-3">{paragraph}</p>;
              })}
            </div>

            {currentSection.code && <CodeBlock code={currentSection.code} />}
          </div>
        )}
      </div>
    </div>
  );
}
