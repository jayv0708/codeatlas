import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { CookieConsent } from "@/components/site/cookie-consent";
import { CONSENT_STORAGE_KEY } from "@/lib/consent";

function storedConsent(): Record<string, unknown> | null {
  const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
}

describe("CookieConsent", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the banner before consent is given", () => {
    render(<CookieConsent />);
    expect(screen.getByRole("region", { name: /cookie consent/i })).toBeInTheDocument();
    expect(screen.getByText("We value your privacy")).toBeInTheDocument();
  });

  it("hides after Accept all and persists full consent", async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(screen.getByRole("button", { name: /accept all/i }));

    expect(screen.queryByRole("region", { name: /cookie consent/i })).not.toBeInTheDocument();
    expect(storedConsent()).toEqual({ necessary: true, analytics: true, marketing: true });
  });

  it("persists minimal consent on Reject optional", async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(screen.getByRole("button", { name: /reject optional/i }));

    expect(storedConsent()).toEqual({ necessary: true, analytics: false, marketing: false });
  });

  it("saves preferences from the settings dialog", async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(screen.getByRole("button", { name: /cookie settings/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Necessary stays locked; enable analytics.
    const analyticsSwitch = screen.getByRole("switch", { name: /analytics cookies/i });
    await user.click(analyticsSwitch);

    await user.click(screen.getByRole("button", { name: /save preferences/i }));

    expect(storedConsent()).toEqual({ necessary: true, analytics: true, marketing: false });
    expect(screen.queryByRole("region", { name: /cookie consent/i })).not.toBeInTheDocument();
  });
});
