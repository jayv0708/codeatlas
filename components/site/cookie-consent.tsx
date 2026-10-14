"use client";

import { useState } from "react";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

/**
 * Cookie consent banner (spec §31).
 *
 * Necessary cookies (auth/session/security) are always on. Optional categories
 * (analytics, marketing) are never loaded before explicit consent — the app
 * currently loads no third-party scripts at all; consent merely records the
 * user's choice for when those integrations are introduced.
 */
export function CookieConsent() {
  const { consent, loaded, acceptAll, rejectOptional, update } = useCookieConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(false);
  const [draftMarketing, setDraftMarketing] = useState(false);

  if (!loaded || consent) return null;

  // The banner only renders while `consent` is null, so drafts start off.
  const openSettings = () => {
    setDraftAnalytics(false);
    setDraftMarketing(false);
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    update({ analytics: draftAnalytics, marketing: draftMarketing });
    setSettingsOpen(false);
  };

  return (
    <>
      <div
        role="region"
        aria-label="Cookie consent"
        className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-xl p-5 shadow-2xl"
        style={{ background: '#111317', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-sm font-medium" style={{ color: '#f4f2eb' }}>We value your privacy</p>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: '#a3a19c' }}>
          We use necessary cookies for authentication and security. Optional cookies (analytics,
          marketing) are only enabled with your consent. See our{" "}
          <Link href="/privacy" className="underline-offset-2 hover:underline" style={{ color: '#ffb59e' }}>
            Privacy Policy
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#a3a19c', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={openSettings}
          >
            Cookie settings
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#f4f2eb', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={rejectOptional}
          >
            Reject optional
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{ background: '#ffb59e', color: '#0f111a' }}
            onClick={acceptAll}
          >
            Accept all
          </button>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent
          style={{ background: '#161820', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: '#f4f2eb' }}>Cookie settings</DialogTitle>
            <DialogDescription style={{ color: '#a3a19c' }}>
              Choose which cookies CodeAtlas may use. Necessary cookies keep you signed in and
              secure and cannot be disabled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: '#f4f2eb' }}>Necessary</p>
                <p className="text-xs" style={{ color: '#8b949e' }}>Authentication, security, session.</p>
              </div>
              <Switch checked disabled aria-label="Necessary cookies (always enabled)" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: '#f4f2eb' }}>Analytics</p>
                <p className="text-xs" style={{ color: '#8b949e' }}>Anonymous usage measurement.</p>
              </div>
              <Switch
                checked={draftAnalytics}
                onCheckedChange={setDraftAnalytics}
                aria-label="Analytics cookies"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: '#f4f2eb' }}>Marketing</p>
                <p className="text-xs" style={{ color: '#8b949e' }}>Personalized content and campaigns.</p>
              </div>
              <Switch
                checked={draftMarketing}
                onCheckedChange={setDraftMarketing}
                aria-label="Marketing cookies"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#f4f2eb', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={() => setSettingsOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all"
              style={{ background: '#ffb59e', color: '#0f111a' }}
              onClick={saveSettings}
            >
              Save preferences
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
