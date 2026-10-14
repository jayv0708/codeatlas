import { ImageResponse } from "next/og";

export const alt = "CodeAtlas — AI Intelligence for Your Codebase";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const monoStack = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "72px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        color: "#f8fafc",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "36px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "30px",
            fontWeight: 700,
            color: "#fff",
          }}
        >
          CA
        </div>
        <div style={{ fontSize: "36px", fontWeight: 600, letterSpacing: "-0.02em" }}>CodeAtlas</div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: "64px",
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
        }}
      >
        <span>Understand your entire software</span>
        <span>system with AI.</span>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: "28px",
          fontSize: "28px",
          color: "#94a3b8",
          maxWidth: "900px",
          fontFamily: monoStack,
        }}
      >
        AI-powered code search · architecture analysis · dependency mapping · Git intelligence
      </div>
    </div>,
    size,
  );
}
