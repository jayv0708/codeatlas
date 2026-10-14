import type { Metadata } from "next";

import { siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How CodeAtlas collects, processes, stores, and protects your data.",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Introduction",
    body: [
      "This Privacy Policy explains what information CodeAtlas collects, why we collect it, how it is processed and stored, and the rights you have over it.",
      "CodeAtlas may process private source code on your behalf. This document explains exactly what is accessed, why, where it is stored, whether it is sent to AI providers, how long it is retained, and how you can delete it.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "Account information: your name, email address, and profile picture, provided when you sign in.",
      "Usage information: pages visited, features used, and error diagnostics needed to operate and improve the service.",
      "Technical information: IP address, browser type, and device information where required for security and rate limiting.",
    ],
  },
  {
    title: "3. GitHub Information",
    body: [
      "When you sign in with GitHub, we receive your public profile (name, username, email, avatar).",
      "When you connect a repository, we access the repository contents you explicitly choose to connect. We request only the minimum GitHub permissions needed to provide the service.",
      "We never access repositories you have not connected, and we never modify or delete content in your GitHub account.",
    ],
  },
  {
    title: "4. Repository Data & Source Code Processing",
    body: [
      "Connected source code is copied into our infrastructure so it can be parsed, indexed, and searched.",
      "The source code is used solely to provide the CodeAtlas intelligence features you request: indexing, semantic search, architecture analysis, and answers to your questions.",
      "Repository data is not sold, rented, or shared with third parties except as described in this policy (AI processing and infrastructure providers).",
    ],
  },
  {
    title: "5. AI Processing",
    body: [
      "To answer questions about your codebase, relevant excerpts of your code may be sent to the AI provider we use. We send only the minimum context required to answer your question — never your entire repository.",
      "Our AI provider may process this data to generate responses. Review the provider's own data-processing terms for details.",
      "We do not use your repository data to train our own models, and we do not allow our AI provider to use your data for training where a no-training option is available and we can enforce it.",
    ],
  },
  {
    title: "6. Third-Party Services",
    body: [
      "We use infrastructure providers (hosting, database, and object storage) to operate the service. These providers process data only to provide infrastructure to us.",
      "We may use optional analytics and marketing services, but only after you grant consent via the cookie banner.",
    ],
  },
  {
    title: "7. Data Storage & Security",
    body: [
      "Data is stored on encrypted infrastructure. Connections use TLS in transit. Secrets (such as GitHub access tokens) are encrypted at rest.",
      "Access to your data is restricted to personnel and systems that need it to operate the service, subject to the security practices described in our security documentation.",
    ],
  },
  {
    title: "8. Data Retention",
    body: [
      "Account and repository data is retained while your account is active.",
      "Usage and cost logs are aggregated and anonymized after a retention period.",
      "You may delete your account and data at any time as described below.",
    ],
  },
  {
    title: "9. Data Deletion",
    body: [
      "Deleting a repository removes its stored code, index, and derived data from our systems.",
      "Deleting your account removes your account data, connected repositories, and derived data, and revokes our access to your GitHub account.",
      "Request deletion by contacting us at the address below; we will confirm and complete deletion within a reasonable period.",
    ],
  },
  {
    title: "10. Cookies",
    body: [
      "Necessary cookies: required for authentication, security, and session management. These are always active.",
      "Optional cookies (analytics, marketing): only activated after you give consent via the cookie banner. You can change your choice at any time.",
    ],
  },
  {
    title: "11. Your Rights",
    body: [
      "Depending on your jurisdiction, you may have rights to access, correct, export, or delete your personal data, and to object to or restrict processing.",
      "To exercise these rights, contact us at the address below.",
    ],
  },
  {
    title: "12. Contact",
    body: [
      `For privacy questions or requests, email ${siteConfig.email}.`,
      "This document is a pre-launch draft. It must be reviewed by a qualified legal professional before public launch.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="text-sm font-medium uppercase tracking-widest" style={{ color: '#aa3000' }}>
          Legal
        </p>
        <h1
          className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight"
          style={{ color: '#f4f2eb' }}
        >
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm" style={{ color: '#8b949e' }}>
          Last updated: draft (pre-launch). Effective for the CodeAtlas service.
        </p>

        <div
          className="mt-6 rounded-lg p-4 text-sm"
          style={{ background: 'rgba(255,181,158,0.08)', border: '1px solid rgba(255,181,158,0.15)', color: '#ffb59e' }}
        >
          <strong style={{ color: '#ffb59e' }}>Legal review required:</strong> this is a draft
          privacy policy written by the product team. It must be reviewed by qualified legal
          counsel before public launch.
        </div>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2
                className="text-lg font-semibold"
                style={{ color: '#f4f2eb' }}
              >
                {section.title}
              </h2>
              {section.body.map((paragraph, i) => (
                <p
                  key={i}
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: '#a3a19c' }}
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
