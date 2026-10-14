import type { Consent } from "@/types";

/**
 * Cookie consent storage.
 *
 * Rule (spec §31): optional cookies (analytics/marketing) are never loaded
 * before explicit consent. `necessary` (auth, security, session) is always on
 * and cannot be disabled. Storage is client-side localStorage; no consent data
 * is sent to any third party.
 */
export const CONSENT_STORAGE_KEY = "codeatlas:consent:v1";

export const DEFAULT_CONSENT: Consent = { necessary: true, analytics: false, marketing: false };

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Consent>;
    if (parsed.necessary !== true) return null;
    return {
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
    };
  } catch {
    return null;
  }
}

export function writeConsent(consent: Consent): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // Storage unavailable (private mode / disabled) — consent is not persisted,
    // which is safe: no optional cookies are loaded either way.
  }
}
