import { CookieConsent } from "@/components/site/cookie-consent";
import { StitchBackground } from "@/components/site/stitch/stitch-background";
import { StitchFooter } from "@/components/site/stitch/stitch-footer";
import { StitchHeaderServer } from "@/components/site/stitch/stitch-header-server";

/**
 * Marketing layout — renders INSTANTLY without any server-side auth check.
 * Marketing pages are public. The user session is fetched client-side
 * by the header dock so navigation between pages is not blocked by a
 * database-backed auth() call.
 */
export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="stitch bg-background text-on-background font-sans antialiased min-h-screen flex flex-col relative selection:bg-accent/30 selection:text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <StitchBackground />
      <StitchHeaderServer />
      <main id="main" className="flex-grow flex flex-col relative z-10 w-full px-8">
        {children}
      </main>
      <StitchFooter />
      <CookieConsent />
    </div>
  );
}
