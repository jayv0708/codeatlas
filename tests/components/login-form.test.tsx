import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/login-form";

const signInMock = vi.fn();

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

describe("LoginForm", () => {
  it("renders the GitHub sign-in button", () => {
    render(<LoginForm error={null} />);
    expect(screen.getByRole("button", { name: /continue with github/i })).toBeInTheDocument();
  });

  it("starts GitHub sign-in with the dashboard callback URL", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue(undefined);
    render(<LoginForm error={null} />);

    await user.click(screen.getByRole("button", { name: /continue with github/i }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith("github", { callbackUrl: "/dashboard" });
    });
  });

  it("shows a loading state while sign-in is in flight", async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    signInMock.mockReturnValue(new Promise<void>((r) => (resolve = r)));

    render(<LoginForm error={null} />);
    await user.click(screen.getByRole("button", { name: /continue with github/i }));

    const button = screen.getByRole("button", { name: /continue with github/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    resolve();
  });

  it("shows an error alert when provided by the server", () => {
    render(<LoginForm error="GitHub sign-in could not be completed. Please try again." />);
    expect(screen.getByRole("alert")).toHaveTextContent(/could not be completed/i);
  });

  it("surfaces client-side sign-in failures", async () => {
    const user = userEvent.setup();
    signInMock.mockRejectedValue(new Error("boom"));

    render(<LoginForm error={null} />);
    await user.click(screen.getByRole("button", { name: /continue with github/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/could not be started/i);
    });
  });
});
