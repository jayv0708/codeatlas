"use client";

import { useCallback, useEffect, useState } from "react";

import { DEFAULT_CONSENT, readConsent, writeConsent } from "@/lib/consent";
import type { Consent } from "@/types";

export function useCookieConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setLoaded(true);
  }, []);

  const acceptAll = useCallback(() => {
    const next: Consent = { necessary: true, analytics: true, marketing: true };
    writeConsent(next);
    setConsent(next);
  }, []);

  const rejectOptional = useCallback(() => {
    writeConsent(DEFAULT_CONSENT);
    setConsent(DEFAULT_CONSENT);
  }, []);

  const update = useCallback((patch: Partial<Pick<Consent, "analytics" | "marketing">>) => {
    setConsent((prev) => {
      const current = prev ?? DEFAULT_CONSENT;
      const next: Consent = {
        necessary: true,
        analytics: patch.analytics ?? current.analytics,
        marketing: patch.marketing ?? current.marketing,
      };
      writeConsent(next);
      return next;
    });
  }, []);

  return { consent, loaded, acceptAll, rejectOptional, update };
}
