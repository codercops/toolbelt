import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";
import type { Tool } from "./tools";

// Shared social-card renderer. Every page's opengraph-image route derives its
// card from here, so the brand, typography, and layout are identical and can
// never drift between pages. Copy and accent come from the tool registry.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// The subset Noto Sans bundled for invoice PDFs (Latin + currency) is reused for
// every card, so text is real, hinted glyphs rather than the satori fallback.
// These routes are prerendered at build time, so reading from the working
// directory is safe (and avoids the edge-only fetch(new URL(import.meta.url))).
let fonts: { name: string; data: Buffer; weight: 400 | 700; style: "normal" }[] | null = null;
function ogFonts() {
  if (!fonts) {
    const dir = join(process.cwd(), "public", "fonts");
    fonts = [
      { name: "Noto Sans", data: readFileSync(join(dir, "NotoSans-Regular.ttf")), weight: 400, style: "normal" },
      { name: "Noto Sans", data: readFileSync(join(dir, "NotoSans-Bold.ttf")), weight: 700, style: "normal" },
    ];
  }
  return fonts;
}

const BG = "#0A0B0F";
const FG = "#E8E6E1";
const MUTED = "#8A93A8";
const HAIRLINE = "rgba(255,255,255,0.12)";

// The subset font has no arrow glyph, so keep card text to Latin + punctuation.
function safe(text: string): string {
  return text.replace(/\s*(?:→|->)\s*/g, " to ");
}

interface OgCardProps {
  badge: string;
  title: string;
  description: string;
  chips: string[];
  url: string;
  accent: string;
  /** Four bars in the footer. Tools pass one accent; the home card passes four. */
  accentBars: string[];
}

function OgCard({ badge, title, description, chips, url, accent, accentBars }: OgCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        padding: 72,
        background: `linear-gradient(135deg, #0E1420 0%, ${BG} 62%)`,
        color: FG,
        fontFamily: "Noto Sans",
      }}
    >
      {/* Faint grid texture */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.5,
        }}
      />
      {/* Accent glow, top-right */}
      <div
        style={{
          position: "absolute",
          top: -180,
          right: -160,
          width: 620,
          height: 620,
          display: "flex",
          borderRadius: 620,
          background: `radial-gradient(circle, ${accent}33 0%, transparent 62%)`,
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 15,
              border: `1px solid ${accent}66`,
              background: "rgba(255,255,255,0.03)",
              color: accent,
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            {"{}"}
          </div>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 3, color: MUTED, fontWeight: 700 }}>
            CODERCOPS · TOOLS
          </div>
        </div>
        <div
          style={{
            display: "flex",
            padding: "10px 22px",
            borderRadius: 999,
            border: `1px solid ${accent}59`,
            background: `${accent}1a`,
            color: accent,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          {badge}
        </div>
      </div>

      {/* Middle */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", width: 68, height: 6, borderRadius: 3, background: accent }} />
        <div
          style={{
            display: "flex",
            fontSize: 70,
            fontWeight: 700,
            lineHeight: 1.03,
            letterSpacing: -1.5,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 28, lineHeight: 1.35, color: MUTED, maxWidth: 900 }}>
          {description}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 6 }}>
          {chips.map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                padding: "8px 16px",
                borderRadius: 999,
                border: `1px solid ${HAIRLINE}`,
                background: "rgba(255,255,255,0.02)",
                color: "#C2C8D6",
                fontSize: 20,
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: accent }}>{url}</div>
        <div style={{ display: "flex", gap: 10 }}>
          {accentBars.map((c, i) => (
            <div key={i} style={{ display: "flex", width: 44, height: 6, borderRadius: 3, background: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function render(props: OgCardProps) {
  return new ImageResponse(<OgCard {...props} />, { ...OG_SIZE, fonts: ogFonts() });
}

/** Social card for a tool page, driven entirely by its registry entry. */
export function renderToolOgImage(tool: Tool) {
  const a = tool.accentHex;
  return render({
    badge: tool.tagline.toUpperCase(),
    title: tool.title,
    description: safe(tool.ogDescription),
    chips: tool.features.map(safe),
    url: `tools.codercops.com${tool.path}`,
    accent: a,
    accentBars: [`${a}ff`, `${a}b3`, `${a}73`, `${a}40`],
  });
}

/** Social card for the homepage. */
export function renderHomeOgImage() {
  return render({
    badge: "OPEN SOURCE",
    title: "Sharp, focused tools for shipping software",
    description:
      "Free, privacy-first developer utilities. JSON formatter, JWT decoder, Base64, invoice generator. Everything runs in your browser.",
    chips: ["No login", "No uploads", "No tracking", "Open source", "MIT"],
    url: "tools.codercops.com",
    accent: "#00E5C7",
    accentBars: ["#5AB5FF", "#9E7BFF", "#FFB547", "#A6F36B"],
  });
}
