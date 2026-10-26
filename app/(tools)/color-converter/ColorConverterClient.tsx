"use client";

import { useId, useMemo, useState } from "react";
import {
  ArrowUpDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Palette,
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  parseColor,
  parseHslComponents,
  toHex,
  toRgbString,
  toHslString,
  toHslWithAlpha,
  relativeLuminance,
  contrastRatio,
  formatContrastRatio,
  wcagRating,
  type RgbaColor,
} from "@/lib/color-utils";
import { CopyButton } from "@/components/shared/CopyButton";
import { useToast } from "@/components/shared/Toast";
import { useRegisterCommands } from "@/components/shared/CommandPalette";
import { ShortcutsLegend } from "@/components/shared/ShortcutsLegend";
import { cn } from "@/lib/cn";

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

function hex6(color: RgbaColor): string {
  const r = Math.round(Math.max(0, Math.min(255, color.r))).toString(16).padStart(2, "0");
  const g = Math.round(Math.max(0, Math.min(255, color.g))).toString(16).padStart(2, "0");
  const b = Math.round(Math.max(0, Math.min(255, color.b))).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

export function ColorConverterClient() {
  const [colorInput, setColorInput] = useState("#F26DF0");
  const [fgInput, setFgInput] = useState("#FFFFFF");
  const [bgInput, setBgInput] = useState("#0A0B0F");
  const { push } = useToast();

  const colorInputId = useId();
  const colorPickerId = useId();
  const alphaSliderId = useId();
  const fgInputId = useId();
  const fgPickerId = useId();
  const bgInputId = useId();
  const bgPickerId = useId();

  // Parse primary color
  const parsed = useMemo(() => parseColor(colorInput), [colorInput]);

  // Derived formats
  const hexValue = useMemo(() => (parsed.ok ? toHex(parsed.value) : ""), [parsed]);
  const rgbValue = useMemo(() => (parsed.ok ? toRgbString(parsed.value) : ""), [parsed]);
  const hslValue = useMemo(() => (parsed.ok ? toHslString(parsed.value) : ""), [parsed]);
  const pickerHex = useMemo(
    () => (parsed.ok ? hex6(parsed.value) : "#F26DF0"),
    [parsed]
  );
  const alphaVal = parsed.ok ? parsed.value.a : 1;
  const luminanceVal = parsed.ok ? relativeLuminance(parsed.value).toFixed(4) : "—";

  // Contrast calculations
  const parsedFg = useMemo(() => parseColor(fgInput), [fgInput]);
  const parsedBg = useMemo(() => parseColor(bgInput), [bgInput]);

  const contrastResult = useMemo(() => {
    if (!parsedFg.ok || !parsedBg.ok) return null;
    const ratio = contrastRatio(parsedFg.value, parsedBg.value);
    const rating = wcagRating(ratio);
    const fgLum = relativeLuminance(parsedFg.value);
    const bgLum = relativeLuminance(parsedBg.value);
    return { ratio, rating, fgLum, bgLum };
  }, [parsedFg, parsedBg]);

  // Color picker synchronization
  function handleNativeColorChange(hex: string) {
    if (parsed.ok && parsed.value.a < 1) {
      const nextParsed = parseColor(hex);
      if (nextParsed.ok) {
        setColorInput(toHex({ ...nextParsed.value, a: parsed.value.a }));
        return;
      }
    }
    setColorInput(hex);
  }

  function handleAlphaChange(newAlpha: number) {
    if (!parsed.ok) return;
    const updated = { ...parsed.value, a: newAlpha };
    const input = colorInput.trim();
    if (/^rgb/i.test(input)) {
      setColorInput(toRgbString(updated));
    } else if (/^hsl/i.test(input)) {
      const hsl = parseHslComponents(input);
      if (hsl.ok) {
        setColorInput(toHslWithAlpha(hsl.value, newAlpha));
      }
    } else {
      setColorInput(toHex(updated));
    }
  }

  function swapContrastColors() {
    setFgInput(bgInput);
    setBgInput(fgInput);
    push("Contrast colors swapped", "success");
  }

  function useAsForeground() {
    if (parsed.ok) {
      setFgInput(toHex(parsed.value));
      push("Set as contrast foreground", "success");
    }
  }

  function useAsBackground() {
    if (parsed.ok) {
      setBgInput(toHex(parsed.value));
      push("Set as contrast background", "success");
    }
  }

  useRegisterCommands(
    "color-converter",
    [
      {
        id: "color:swap",
        section: "Color Converter",
        title: "Swap contrast foreground & background",
        run: swapContrastColors,
      },
      {
        id: "color:set-fg",
        section: "Color Converter",
        title: "Use current color as contrast foreground",
        run: useAsForeground,
      },
      {
        id: "color:set-bg",
        section: "Color Converter",
        title: "Use current color as contrast background",
        run: useAsBackground,
      },
      {
        id: "color:copy-hex",
        section: "Color Converter",
        title: "Copy current color as HEX",
        run: async () => {
          if (hexValue) {
            await navigator.clipboard.writeText(hexValue);
            push("Copied HEX to clipboard", "success");
          }
        },
      },
      {
        id: "color:copy-rgb",
        section: "Color Converter",
        title: "Copy current color as RGB",
        run: async () => {
          if (rgbValue) {
            await navigator.clipboard.writeText(rgbValue);
            push("Copied RGB to clipboard", "success");
          }
        },
      },
      {
        id: "color:copy-hsl",
        section: "Color Converter",
        title: "Copy current color as HSL",
        run: async () => {
          if (hslValue) {
            await navigator.clipboard.writeText(hslValue);
            push("Copied HSL to clipboard", "success");
          }
        },
      },
    ],
    [hexValue, rgbValue, hslValue, fgInput, bgInput, parsed]
  );

  return (
    <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-12 space-y-8">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 font-mono text-[12px] text-[var(--fg-dim)]">
          <Palette className="w-3.5 h-3.5 text-[var(--fuchsia)]" />
          <span>Live Color Inspector & WCAG 2.1 Contrast Calculator</span>
        </div>
        <ShortcutsLegend
          shortcuts={[
            { keys: [MOD, "K"], label: "Command palette" },
            { keys: ["Tab"], label: "Navigate inputs" },
          ]}
        />
      </div>

      {/* Main Color Inspector & Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input + Swatch */}
        <div className="lg:col-span-5 card p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <label
              htmlFor={colorInputId}
              className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--fg-dim)] font-medium"
            >
              Color input
            </label>
            <span className="font-mono text-[11px] text-[var(--fg-dim)]">
              HEX · RGB · HSL
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                id={colorInputId}
                type="text"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                placeholder="e.g. #F26DF0, rgb(242, 109, 240), hsl(301, 84%, 69%)"
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg font-mono text-[13.5px] bg-[var(--bg-card)] border text-[var(--fg)] placeholder:text-[var(--fg-dim)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--fuchsia)]",
                  parsed.ok
                    ? "border-[var(--hairline-strong)]"
                    : "border-[var(--rose)] ring-1 ring-[var(--rose)]"
                )}
                aria-invalid={!parsed.ok}
                aria-describedby={!parsed.ok ? "color-input-error" : undefined}
              />
            </div>

            {/* Synchronized native color picker */}
            <div className="relative group flex items-center justify-center">
              <input
                id={colorPickerId}
                type="color"
                value={pickerHex}
                onChange={(e) => handleNativeColorChange(e.target.value)}
                className="sr-only peer"
                aria-label="Pick color with native system picker"
              />
              <label
                htmlFor={colorPickerId}
                className="w-10 h-10 rounded-lg border border-[var(--hairline-strong)] shadow-sm cursor-pointer overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition-transform peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--fuchsia)]"
                style={{ backgroundColor: pickerHex }}
                title="Click to open system color picker"
              >
                <span className="sr-only">Choose color</span>
              </label>
            </div>
          </div>

          {!parsed.ok && (
            <div
              id="color-input-error"
              className="flex items-start gap-2 text-[12px] font-mono text-[var(--rose)]"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{parsed.error}</span>
            </div>
          )}

          {/* Live Swatch with Transparency Checkerboard */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--fg-dim)]">
              <span>Live swatch</span>
              <span>Luminance: {luminanceVal}</span>
            </div>

            <div
              className="relative w-full h-32 rounded-xl border border-[var(--hairline-strong)] overflow-hidden shadow-inner flex items-end justify-between p-4"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #222530 25%, transparent 25%),
                  linear-gradient(-45deg, #222530 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #222530 75%),
                  linear-gradient(-45deg, transparent 75%, #222530 75%)
                `,
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                backgroundColor: "#161822",
              }}
            >
              {parsed.ok && (
                <div
                  className="absolute inset-0 transition-colors"
                  style={{ backgroundColor: toRgbString(parsed.value) }}
                  aria-label={`Color swatch for ${hexValue}`}
                />
              )}

              {/* Swatch info pill */}
              <div className="relative z-10 backdrop-blur-md bg-black/40 border border-white/10 px-2.5 py-1 rounded-md font-mono text-[11px] text-white flex items-center gap-2">
                <span className="font-semibold">{hexValue || "—"}</span>
                <span className="text-white/60">·</span>
                <span>Alpha {Math.round(alphaVal * 100)}%</span>
              </div>

              <div className="relative z-10 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={useAsForeground}
                  disabled={!parsed.ok}
                  className="backdrop-blur-md bg-black/40 border border-white/10 px-2.5 py-1 rounded-md font-mono text-[11px] text-white hover:bg-black/60 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Use this color as contrast foreground"
                >
                  Set as FG
                </button>
                <button
                  type="button"
                  onClick={useAsBackground}
                  disabled={!parsed.ok}
                  className="backdrop-blur-md bg-black/40 border border-white/10 px-2.5 py-1 rounded-md font-mono text-[11px] text-white hover:bg-black/60 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Use this color as contrast background"
                >
                  Set as BG
                </button>
              </div>
            </div>
          </div>

          {/* Alpha Slider */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between font-mono text-[12px]">
              <label htmlFor={alphaSliderId} className="flex items-center gap-1.5 text-[var(--fg-muted)]">
                <Sliders className="w-3.5 h-3.5 text-[var(--fuchsia)]" />
                <span>Alpha / Opacity</span>
              </label>
              <span className="text-[var(--fg)] font-semibold">
                {Math.round(alphaVal * 100)}%
              </span>
            </div>
            <input
              id={alphaSliderId}
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={alphaVal}
              disabled={!parsed.ok}
              onChange={(e) => handleAlphaChange(parseFloat(e.target.value))}
              className="w-full accent-[var(--fuchsia)] cursor-pointer"
              aria-label="Adjust opacity alpha channel"
            />
          </div>
        </div>

        {/* Right Column: Converted formats */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <h2 className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--fg-dim)] font-medium">
                Color Formats & Copy
              </h2>
              <span className="font-mono text-[11px] text-[var(--fg-dim)]">CSS Ready</span>
            </div>

            {/* HEX Output */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-[var(--bg-raise)] border border-[var(--hairline)]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-wider uppercase text-[var(--fg-dim)] bg-[var(--bg-card)] px-1.5 py-0.5 rounded border border-[var(--hairline)]">
                    HEX
                  </span>
                  <span className="text-[11px] text-[var(--fg-dim)]">
                    {alphaVal < 1 ? "8-digit hex with alpha (#rrggbbaa)" : "6-digit hex (#rrggbb)"}
                  </span>
                </div>
                <div className="font-mono text-[15px] font-semibold text-[var(--fg)] select-all">
                  {hexValue || "—"}
                </div>
              </div>
              <CopyButton
                value={hexValue}
                label="Copy HEX"
                successMessage="Copied HEX color ✓"
                disabled={!parsed.ok}
              />
            </div>

            {/* RGB Output */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-[var(--bg-raise)] border border-[var(--hairline)]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-wider uppercase text-[var(--fg-dim)] bg-[var(--bg-card)] px-1.5 py-0.5 rounded border border-[var(--hairline)]">
                    RGB
                  </span>
                  <span className="text-[11px] text-[var(--fg-dim)]">
                    {alphaVal < 1 ? "rgba(r, g, b, a)" : "rgb(r, g, b)"}
                  </span>
                </div>
                <div className="font-mono text-[15px] font-semibold text-[var(--fg)] select-all">
                  {rgbValue || "—"}
                </div>
              </div>
              <CopyButton
                value={rgbValue}
                label="Copy RGB"
                successMessage="Copied RGB color ✓"
                disabled={!parsed.ok}
              />
            </div>

            {/* HSL Output */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-[var(--bg-raise)] border border-[var(--hairline)]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-wider uppercase text-[var(--fg-dim)] bg-[var(--bg-card)] px-1.5 py-0.5 rounded border border-[var(--hairline)]">
                    HSL
                  </span>
                  <span className="text-[11px] text-[var(--fg-dim)]">
                    {alphaVal < 1 ? "hsla(h, s%, l%, a)" : "hsl(h, s%, l%)"}
                  </span>
                </div>
                <div className="font-mono text-[15px] font-semibold text-[var(--fg)] select-all">
                  {hslValue || "—"}
                </div>
              </div>
              <CopyButton
                value={hslValue}
                label="Copy HSL"
                successMessage="Copied HSL color ✓"
                disabled={!parsed.ok}
              />
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="card p-4 bg-[var(--bg-card)] border border-[var(--hairline)] flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-[var(--fuchsia)] shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-[var(--fg-muted)] leading-relaxed">
              Accepts HEX (3, 4, 6, 8 digits), standard <code className="text-[var(--fg)]">rgb()</code> /{" "}
              <code className="text-[var(--fg)]">rgba()</code>, and <code className="text-[var(--fg)]">hsl()</code> /{" "}
              <code className="text-[var(--fg)]">hsla()</code> with both comma-separated and modern CSS space-separated slash syntax.
            </p>
          </div>
        </div>
      </div>

      {/* WCAG Contrast Checker Section */}
      <div className="card p-5 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--hairline)] pb-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-[var(--fg)]">
              WCAG Contrast Checker
            </h2>
            <p className="mt-1 text-[13px] text-[var(--fg-muted)]">
              Evaluate readability and compliance against WCAG 2.1 Level AA and AAA standards.
            </p>
          </div>
          <button
            type="button"
            onClick={swapContrastColors}
            className="btn self-start sm:self-auto text-[12.5px] font-mono"
            aria-label="Swap foreground and background colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[var(--fuchsia)]" />
            <span>Swap colors</span>
          </button>
        </div>

        {/* Inputs for Foreground and Background */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Foreground */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor={fgInputId}
                className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--fg-dim)] font-medium"
              >
                Text / Foreground
              </label>
              <span className="font-mono text-[11px] text-[var(--fg-dim)]">
                {parsedFg.ok ? `L: ${relativeLuminance(parsedFg.value).toFixed(3)}` : "Invalid"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id={fgInputId}
                type="text"
                value={fgInput}
                onChange={(e) => setFgInput(e.target.value)}
                placeholder="#FFFFFF"
                className={cn(
                  "flex-1 px-3.5 py-2.5 rounded-lg font-mono text-[13px] bg-[var(--bg-raise)] border text-[var(--fg)] placeholder:text-[var(--fg-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--fuchsia)]",
                  parsedFg.ok ? "border-[var(--hairline)]" : "border-[var(--rose)] ring-1 ring-[var(--rose)]"
                )}
                aria-invalid={!parsedFg.ok}
              />
              <input
                id={fgPickerId}
                type="color"
                value={parsedFg.ok ? hex6(parsedFg.value) : "#ffffff"}
                onChange={(e) => setFgInput(e.target.value)}
                className="sr-only peer"
                aria-label="Foreground color picker"
              />
              <label
                htmlFor={fgPickerId}
                className="w-10 h-10 rounded-lg border border-[var(--hairline-strong)] cursor-pointer overflow-hidden flex items-center justify-center shrink-0 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--fuchsia)]"
                style={{ backgroundColor: parsedFg.ok ? toHex(parsedFg.value) : "#ffffff" }}
                title="Pick foreground color"
              >
                <span className="sr-only">Choose foreground color</span>
              </label>
            </div>
          </div>

          {/* Background */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor={bgInputId}
                className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--fg-dim)] font-medium"
              >
                Surface / Background
              </label>
              <span className="font-mono text-[11px] text-[var(--fg-dim)]">
                {parsedBg.ok ? `L: ${relativeLuminance(parsedBg.value).toFixed(3)}` : "Invalid"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id={bgInputId}
                type="text"
                value={bgInput}
                onChange={(e) => setBgInput(e.target.value)}
                placeholder="#0A0B0F"
                className={cn(
                  "flex-1 px-3.5 py-2.5 rounded-lg font-mono text-[13px] bg-[var(--bg-raise)] border text-[var(--fg)] placeholder:text-[var(--fg-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--fuchsia)]",
                  parsedBg.ok ? "border-[var(--hairline)]" : "border-[var(--rose)] ring-1 ring-[var(--rose)]"
                )}
                aria-invalid={!parsedBg.ok}
              />
              <input
                id={bgPickerId}
                type="color"
                value={parsedBg.ok ? hex6(parsedBg.value) : "#000000"}
                onChange={(e) => setBgInput(e.target.value)}
                className="sr-only peer"
                aria-label="Background color picker"
              />
              <label
                htmlFor={bgPickerId}
                className="w-10 h-10 rounded-lg border border-[var(--hairline-strong)] cursor-pointer overflow-hidden flex items-center justify-center shrink-0 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--fuchsia)]"
                style={{ backgroundColor: parsedBg.ok ? toHex(parsedBg.value) : "#000000" }}
                title="Pick background color"
              >
                <span className="sr-only">Choose background color</span>
              </label>
            </div>
          </div>
        </div>

        {/* Live Preview Container */}
        {contrastResult && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Real Text Sample Render */}
            <div
              className="lg:col-span-7 rounded-xl border border-[var(--hairline-strong)] p-6 space-y-4 shadow-sm flex flex-col justify-center transition-colors"
              style={{
                backgroundColor: parsedBg.ok ? toRgbString(parsedBg.value) : "#000000",
                color: parsedFg.ok ? toRgbString(parsedFg.value) : "#ffffff",
              }}
            >
              <div>
                <span className="text-[11px] uppercase tracking-wider opacity-70 block mb-1">
                  Sample Heading (Large Text)
                </span>
                <p className="font-display text-2xl sm:text-3xl font-bold leading-tight">
                  Design Accessible Experiences
                </p>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider opacity-70 block mb-1">
                  Body Copy (Normal Text)
                </span>
                <p className="text-[14.5px] leading-relaxed">
                  Clear typography and sufficient color contrast ensure that content remains legible for
                  users with low vision, color blindness, or varying lighting conditions.
                </p>
              </div>
            </div>

            {/* Compliance Scores */}
            <div className="lg:col-span-5 card bg-[var(--bg-raise)] p-5 space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)]">
                    Contrast Ratio
                  </span>
                  <span className="font-mono text-2xl font-bold text-[var(--fg)]">
                    {formatContrastRatio(contrastResult.ratio)} : 1
                  </span>
                </div>

                <div className="h-1.5 w-full bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--hairline)] mb-4">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      contrastResult.ratio >= 7
                        ? "bg-[var(--cyan)]"
                        : contrastResult.ratio >= 4.5
                        ? "bg-[var(--fuchsia)]"
                        : contrastResult.ratio >= 3
                        ? "bg-[var(--amber)]"
                        : "bg-[var(--rose)]"
                    )}
                    style={{ width: `${Math.min(100, (contrastResult.ratio / 21) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Grid of 4 Badges */}
              <div className="grid grid-cols-2 gap-3">
                {/* Normal AA */}
                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--hairline)] flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[12px] font-semibold text-[var(--fg)]">Normal AA</div>
                    <div className="font-mono text-[10px] text-[var(--fg-dim)]">≥ 4.5:1</div>
                  </div>
                  {contrastResult.rating.normalText.aa ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--cyan)]">
                      <CheckCircle2 className="w-4 h-4" /> PASS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--rose)]">
                      <XCircle className="w-4 h-4" /> FAIL
                    </span>
                  )}
                </div>

                {/* Normal AAA */}
                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--hairline)] flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[12px] font-semibold text-[var(--fg)]">Normal AAA</div>
                    <div className="font-mono text-[10px] text-[var(--fg-dim)]">≥ 7.0:1</div>
                  </div>
                  {contrastResult.rating.normalText.aaa ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--cyan)]">
                      <CheckCircle2 className="w-4 h-4" /> PASS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--rose)]">
                      <XCircle className="w-4 h-4" /> FAIL
                    </span>
                  )}
                </div>

                {/* Large AA */}
                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--hairline)] flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[12px] font-semibold text-[var(--fg)]">Large AA</div>
                    <div className="font-mono text-[10px] text-[var(--fg-dim)]">≥ 3.0:1</div>
                  </div>
                  {contrastResult.rating.largeText.aa ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--cyan)]">
                      <CheckCircle2 className="w-4 h-4" /> PASS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--rose)]">
                      <XCircle className="w-4 h-4" /> FAIL
                    </span>
                  )}
                </div>

                {/* Large AAA */}
                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--hairline)] flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[12px] font-semibold text-[var(--fg)]">Large AAA</div>
                    <div className="font-mono text-[10px] text-[var(--fg-dim)]">≥ 4.5:1</div>
                  </div>
                  {contrastResult.rating.largeText.aaa ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--cyan)]">
                      <CheckCircle2 className="w-4 h-4" /> PASS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--rose)]">
                      <XCircle className="w-4 h-4" /> FAIL
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
