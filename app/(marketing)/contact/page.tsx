import type { Metadata } from "next";
import { Mail } from "lucide-react";

import { siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the CodeAtlas team.",
};

const TOPICS = [
  {
    label: "Support",
    description: "Help with connecting a repository, indexing, or questions about the product.",
  },
  {
    label: "Business",
    description: "Partnerships, enterprise licensing, and sales inquiries.",
  },
  {
    label: "Privacy",
    description: "Data requests, deletion requests, and privacy questions.",
  },
];

export default function ContactPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="text-sm font-medium uppercase tracking-widest" style={{ color: '#aa3000' }}>
          Contact
        </p>
        <h1
          className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight"
          style={{ color: '#f4f2eb' }}
        >
          Get in touch
        </h1>
        <p
          className="mt-4 max-w-xl text-lg leading-relaxed"
          style={{ color: '#a3a19c' }}
        >
          Questions, feedback, or issues with CodeAtlas? We read every message.
        </p>

        <div
          className="mt-8 rounded-lg p-4 text-sm"
          style={{ background: 'rgba(255,181,158,0.08)', border: '1px solid rgba(255,181,158,0.15)', color: '#ffb59e' }}
        >
          <strong style={{ color: '#ffb59e' }}>Placeholder notice:</strong> contact details below
          are placeholders. The project owner must replace{" "}
          <span className="font-mono text-xs">[REAL PROJECT EMAIL]</span> before launch.
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {TOPICS.map((topic) => (
            <div
              key={topic.label}
              className="rounded-xl p-5"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: 'rgba(170,48,0,0.1)', border: '1px solid rgba(170,48,0,0.2)' }}
              >
                <Mail className="h-4 w-4" style={{ color: '#aa3000' }} aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-sm font-semibold" style={{ color: '#f4f2eb' }}>
                {topic.label}
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: '#a3a19c' }}>
                {topic.description}
              </p>
              <p className="mt-3 font-mono text-xs" style={{ color: '#ffb59e' }}>
                {siteConfig.email}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
