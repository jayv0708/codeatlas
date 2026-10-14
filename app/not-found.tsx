import Link from "next/link";
import Image from "next/image";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center"
      style={{ background: '#0f111a', fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif' }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[360px] w-[560px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'rgba(255,181,158,0.1)' }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center">
        {/* Logo */}
        <Image
          src="/favicon.png"
          alt="CodeAtlas"
          width={56}
          height={56}
          className="h-14 w-14 rounded-xl object-contain"
          priority
        />

        {/* 404 badge */}
        <div className="mt-8 flex items-center gap-3" style={{ color: '#ffb59e' }}>
          <Compass className="h-5 w-5" aria-hidden="true" />
          <span className="font-mono text-sm">404 · not found</span>
        </div>

        {/* Heading */}
        <h1
          className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ color: '#f4f2eb' }}
        >
          Lost in the codebase?
        </h1>

        {/* Description */}
        <p
          className="mt-4 max-w-md text-lg leading-relaxed"
          style={{ color: '#a3a19c' }}
        >
          The page you&apos;re looking for doesn&apos;t exist — or it moved to a different module.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-all hover:brightness-110"
            style={{ background: '#ffb59e', color: '#0f111a' }}
          >
            Back to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#f4f2eb', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
