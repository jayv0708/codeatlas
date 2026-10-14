import Image from "next/image";
import Link from "next/link";

import { StitchHeaderDockClient } from "@/components/site/stitch/stitch-header-client";

/**
 * Server component header — renders instantly without waiting for auth.
 * The dock fetches the user session client-side via SessionProvider.
 */
export function StitchHeaderServer() {
  return (
    <header className="w-full px-4 sm:px-8 pt-6 sm:pt-8 pb-10 sm:pb-14 z-20 relative">
      <div className="flex items-center justify-between">
        {/* Logo — links to landing page */}
        <Link href="/" className="flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity">
          <Image
            src="/stitch-logo.jpg"
            alt="CodeAtlas logo"
            width={512}
            height={512}
            priority
            className="h-6 w-auto object-contain opacity-90 mix-blend-plus-lighter brightness-150"
          />
          <span className="font-bold tracking-tight text-lg text-on-surface">CodeAtlas</span>
        </Link>

        {/* Dock — centered, hidden on very small screens. Uses client-side session. */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">
          <StitchHeaderDockClient />
        </div>

        {/* Balance spacer so the dock stays visually centered */}
        <div aria-hidden="true" className="hidden w-36 shrink-0 md:block" />
      </div>
    </header>
  );
}
