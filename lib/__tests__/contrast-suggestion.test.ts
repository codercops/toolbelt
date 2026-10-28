import { describe, expect, it } from "vitest";
import { suggestAccessibleForeground } from "../contrast-suggestion";
import { contrastRatio, hslToRgb, parseColor, parseHslComponents } from "../color-utils";

function rgba(input: string) {
  const parsed = parseColor(input);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

describe("suggestAccessibleForeground", () => {
  it("leaves passing pairs alone", () => {
    expect(suggestAccessibleForeground("#000", "#fff")).toEqual({ status: "passing" });
  });

  it.each([
    ["", "#fff"], ["#xyz", "#fff"], ["#fff", "hsl(120foo, 50%, 50%)"],
  ])("rejects invalid inputs %s / %s", (fg, bg) => {
    expect(suggestAccessibleForeground(fg, bg)).toEqual({ status: "invalid" });
  });

  it.each([
    ["#0008", "#fff"], ["#000", "#fff8"],
    ["rgba(255, 255, 255, 0)", "#000"], ["#fff", "hsla(0, 0%, 0%, 0.99)"],
  ])("does not suggest transparent colors %s / %s", (fg, bg) => {
    expect(suggestAccessibleForeground(fg, bg)).toEqual({ status: "transparent" });
  });

  it.each([
    ["#eee", "#fff"], ["#111", "#000"], ["#f00", "#f00"],
    ["#0f0", "#0f0"], ["#00f", "#00f"], ["#888", "#777"],
    ["hsl(210.5, 40.5%, 60.5%)", "#fff"],
  ])("returns a passing displayed color for %s / %s", (fg, bg) => {
    const result = suggestAccessibleForeground(fg, bg);
    expect(result.status).toBe("suggested");
    if (result.status !== "suggested") throw new Error("Expected suggestion");
    expect(contrastRatio(rgba(result.hex), rgba(bg))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(rgba(result.color), rgba(bg))).toBe(result.ratio);
    expect(rgba(result.color)).toEqual(rgba(result.hex));
  });

  it("crosses the 8-bit rounding boundary instead of accepting a rounded ratio", () => {
    expect(contrastRatio(rgba("#777777"), rgba("#fff"))).toBeLessThan(4.5);
    const result = suggestAccessibleForeground("#777777", "#fff");
    expect(result).toMatchObject({ status: "suggested", hex: "#767676" });
  });

  it.each(["hsl(210.5, 40.5%, 60.5%)", "hsl(0, 0%, 50%)"])(
    "preserves typed hue and saturation and chooses the nearest passing direction for %s", (fg) => {
      const bg = rgba("#757575");
      const source = parseHslComponents(fg);
      const result = suggestAccessibleForeground(fg, "#757575");
      if (!source.ok || result.status !== "suggested") throw new Error("Expected suggestion");
      const suggested = parseHslComponents(result.color);
      if (!suggested.ok) throw new Error("Expected HSL");
      expect(suggested.value.h).toBe(source.value.h);
      expect(suggested.value.s).toBe(source.value.s);
      // Independently check both directions at every 0.01% inside the chosen distance.
      for (let l = 0; l <= 100; l += 0.01) {
        if (Math.abs(l - source.value.l) < result.lightnessChange - 0.0001) {
          expect(contrastRatio(hslToRgb({ ...source.value, l }), bg)).toBeLessThan(4.5);
        }
      }
      const towardsSource = suggested.value.l + (source.value.l > suggested.value.l ? 0.0001 : -0.0001);
      expect(contrastRatio(hslToRgb({ ...source.value, l: towardsSource }), bg)).toBeLessThan(4.5);
    },
  );
});
