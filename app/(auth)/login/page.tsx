import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/services/auth";

export const metadata: Metadata = {
  title: "Sign in — CodeAtlas",
  description: "Sign in to CodeAtlas with GitHub or email.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; verified?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const error = params.error ? getAuthErrorMessage(params.error) : null;
  const verified = params.verified === "true";

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-zinc-100" style={{ fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif' }}>
      {/* ── Left panel (hidden on mobile) ──────────────────────────── */}
      <section className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center border-r border-zinc-800 bg-[#0a0a0a]">
        {/* Ambient glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_50%,rgba(255,77,0,0.12),transparent_60%)] z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(128,0,255,0.08),transparent_50%)] z-0" />

        {/* Grain overlay */}
        <div
          className="absolute inset-0 z-[2] opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              "url(https://lh3.googleusercontent.com/aida-public/AB6AXuBqt6NQhAypDSabz1rK6bdnagnpSGcIDDoZKBGv4Hsw9Gj0IFERSE2v6K8ia73jPWIxjhldJMpMB9HWCHrAXNBSw2EBTN9YapItUA54giJnPhZjSzXp-lGZ3OV8W7ji8BM32mrvP2lDDo9cj7LwHR9jmj_Vsye15P4wTvRe5D1sPeGJJsjlhRYjP__iNkEqG8nrThlOJEV8n1p4sMF8VULVLAXTkPMzJ3mKJcCtb-f3xhmF-82OHqWG)",
          }}
        />

        {/* Scanline animation */}
        <div
          className="w-full h-[100px] z-[3] opacity-10 absolute bottom-full"
          style={{
            background:
              "linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0) 100%)",
            animation: "scanline 6s linear infinite",
          }}
        />

        {/* Ghost heading */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
          <h1 className="font-bold text-[15vw] leading-none text-white opacity-[0.03] select-none uppercase tracking-tighter">
            CodeAtlas
          </h1>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full h-full p-12 flex flex-col justify-between">
          {/* Top: brand label */}
          <div className="flex items-center gap-4">
            <Link href="/" className="uppercase tracking-widest text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors">
              CODEATLAS
            </Link>
          </div>

          {/* Center: artwork */}
          <div className="relative w-full aspect-square max-w-md mx-auto">
            <img
              alt="Abstract orange and black fluid visual"
              className="w-full h-full object-cover rounded-2xl mix-blend-screen opacity-90 shadow-2xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJSDtTiNJOXImgaQYDGzbcBQVrhGBoA6-DNvj1cMWHZnmtUa1w-c5vs9wlmCrBA1yuAuKc06-jDbet5TslRo2HR1CRPTzgyR4elG7Pi_WY8BRM94riKZZwWBg436UG5B8Q3Gb5dEFS4YjQBKIvgTihl_JUgmKiRVRcQlzUgmdQ4dhFcriHPqwuomD-hDtDPhEuMlyANfVidjDmUwSsZ1ep0s_e9-ojDaFa5F2l9dolJ515oUYvydoF"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent rounded-2xl" />
          </div>

          {/* Bottom: testimonial */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl max-w-xs">
            <p className="text-zinc-300 text-sm italic">
              &quot;The most intuitive atlas for mapping modern microservices
              I&apos;ve ever used.&quot;
            </p>
            <div className="flex gap-1 mt-4">
              <div className="h-1 w-8 bg-[#ff4d00]" />
              <div className="h-1 w-2 bg-zinc-700" />
              <div className="h-1 w-2 bg-zinc-700" />
            </div>
          </div>
        </div>

        {/* Vertical side text — positioned absolutely, rotated */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10">
          <div
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 whitespace-nowrap"
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
            }}
          >
            The Developer Experience Standard
          </div>
          <div className="w-px h-8 bg-zinc-800 mx-auto mt-3" />
        </div>
      </section>

      {/* ── Right panel (form) ─────────────────────────────────────── */}
      <section className="w-full lg:w-[55%] flex flex-col justify-center items-center px-6 md:px-12 py-12 bg-[#0a0a0a]">
        <AuthForm error={error} verified={verified} />
      </section>

      {/* Scanline keyframes */}
      <style>{`
        @keyframes scanline {
          0%   { bottom: 100%; }
          100% { bottom: -100px; }
        }
      `}</style>
    </div>
  );
}
