import { contrastRatio, hslToRgb, parseColor, parseHslComponents, rgbToHslExact, toHex } from "./color-utils";

export type ForegroundSuggestion =
  | { status: "invalid" | "transparent" | "passing" }
  | { status: "suggested"; color: string; hex: string; ratio: number; lightnessChange: number };

/** Finds the nearest AA foreground on a 0.0001% HSL lightness grid.
 * Each candidate is checked using the same rounded RGB channels as its displayed HEX.
 * For fixed hue and saturation, channels (and luminance) increase with lightness.
 */
export function suggestAccessibleForeground(foreground: string, background: string): ForegroundSuggestion {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  if (!fg.ok || !bg.ok) return { status: "invalid" };
  if (fg.value.a !== 1 || bg.value.a !== 1) return { status: "transparent" };
  if (contrastRatio(fg.value, bg.value) >= 4.5) return { status: "passing" };

  const typedHsl = parseHslComponents(foreground);
  const hsl = typedHsl.ok ? typedHsl.value : rgbToHslExact(fg.value);
  const scale = 10000;
  const candidate = (step: number) => {
    const l = step / scale;
    const rgb = hslToRgb({ ...hsl, l });
    return {
      status: "suggested" as const,
      color: `hsl(${hsl.h}, ${hsl.s}%, ${l}%)`,
      hex: toHex(rgb),
      ratio: contrastRatio(rgb, bg.value),
      lightnessChange: Math.abs(l - hsl.l),
    };
  };

  function search(lighter: boolean) {
    let low = lighter ? Math.ceil(hsl.l * scale) : 0;
    let high = lighter ? 100 * scale : Math.floor(hsl.l * scale);
    if (candidate(lighter ? high : low).ratio < 4.5) return null;
    while (low < high) {
      const mid = lighter ? Math.floor((low + high) / 2) : Math.ceil((low + high) / 2);
      const passes = candidate(mid).ratio >= 4.5;
      if (lighter ? passes : !passes) high = lighter ? mid : mid - 1;
      else low = lighter ? mid + 1 : mid;
    }
    return candidate(low);
  }

  const darker = search(false);
  const lighter = search(true);
  // Black or white always reaches 4.5 against an opaque sRGB background.
  return darker && (!lighter || darker.lightnessChange <= lighter.lightnessChange)
    ? darker : lighter!;
}
