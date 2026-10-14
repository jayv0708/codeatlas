import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("shows the CodeAtlas 404 message", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: /lost in the codebase\?/i })).toBeInTheDocument();
  });

  it("links back to the dashboard and home", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: /back to dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: /go home/i })).toHaveAttribute("href", "/");
  });
});
