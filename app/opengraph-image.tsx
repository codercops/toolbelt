import { ImageResponse } from "next/og";

export const alt = "CODERCOPS Tools — fast, privacy-first developer utilities";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0E1420 0%, #0A0B0F 55%)",
          color: "#E8E6E1",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#00E5C7",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            {"{}"}
          </div>
          <div style={{ fontSize: 26, letterSpacing: 2, color: "#8289A0" }}>CODERCOPS · TOOLS</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.05, maxWidth: 900 }}>
            Sharp, focused tools for shipping software
          </div>
          <div style={{ fontSize: 28, color: "#8289A0", maxWidth: 880 }}>
            JSON formatter · JWT decoder · Base64 · Invoice generator. Runs entirely in your browser.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["#5AB5FF", "#9E7BFF", "#FFB547", "#A6F36B"].map((c) => (
            <div key={c} style={{ width: 44, height: 6, borderRadius: 3, background: c }} />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
