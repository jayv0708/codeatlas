/**
 * Site-wide configuration used for SEO metadata, canonical links, and OG images.
 *
 * CONTACT PLACEHOLDER: replace `email` with the project owner's real email
 * before launch (see docs/instructions.md). No fake business address is used.
 */
export const siteConfig = {
  name: "CodeAtlas",
  title: "CodeAtlas — AI Intelligence for Your Codebase",
  description:
    "Understand your entire software system with AI-powered code search, architecture analysis, dependency mapping, and Git intelligence.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  /**
   * REPO URL PLACEHOLDER: the public CodeAtlas repository used by the header/footer
   * GitHub links. No repository URL is configured in this project yet — replace
   * with the real URL before launch.
   */
  githubUrl: "https://github.com/",
  email: "[REAL PROJECT EMAIL]",
  keywords: [
    "AI",
    "code search",
    "software architecture",
    "dependency analysis",
    "Git intelligence",
    "developer tools",
    "codebase understanding",
    "RAG",
  ],
} as const;
