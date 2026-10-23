import { describe, it, expect } from "vitest";
import {
  parseColor,
  toHex,
  toRgbString,
  toHslString,
  relativeLuminance,
  contrastRatio,
  formatContrastRatio,
  wcagRating,
  rgbToHsl,
  hslToRgb,
  parseHslComponents,
  toHslWithAlpha,
  type RgbaColor,
} from "../color-utils";

describe("color conversions for red", () => {
  const red: RgbaColor = { r: 255, g: 0, b: 0, a: 1 };

  it("converts red consistently between HEX, RGB, and HSL", () => {
    const hex = toHex(red);
    const rgbStr = toRgbString(red);
    const hslStr = toHslString(red);

    expect(hex).toBe("#ff0000");
    expect(rgbStr).toBe("rgb(255, 0, 0)");
    expect(hslStr).toBe("hsl(0, 100%, 50%)");

    const fromHex = parseColor(hex);
    const fromRgb = parseColor(rgbStr);
    const fromHsl = parseColor(hslStr);

    expect(fromHex).toEqual({ ok: true, value: red });
    expect(fromRgb).toEqual({ ok: true, value: red });
    expect(fromHsl).toEqual({ ok: true, value: red });
  });

  it("converts between RGB and HSL structures accurately", () => {
    const hsl = rgbToHsl(red);
    expect(hsl).toEqual({ h: 0, s: 100, l: 50, a: 1 });
    const backToRgb = hslToRgb(hsl);
    expect(backToRgb).toEqual(red);
  });
});

describe("HEX parsing", () => {
  it("correctly parses #0f08 with normalized alpha", () => {
    const r = parseColor("#0f08");
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    expect(r.value.r).toBe(0);
    expect(r.value.g).toBe(255);
    expect(r.value.b).toBe(0);
    expect(r.value.a).toBeCloseTo(136 / 255, 4);

    expect(toHex(r.value)).toBe("#00ff0088");
  });

  it("parses 3, 6, and 8 digit hex formats", () => {
    expect(parseColor("#fff")).toEqual({
      ok: true,
      value: { r: 255, g: 255, b: 255, a: 1 },
    });
    expect(parseColor("#000000")).toEqual({
      ok: true,
      value: { r: 0, g: 0, b: 0, a: 1 },
    });
    expect(parseColor("#ff000080")).toEqual({
      ok: true,
      value: { r: 255, g: 0, b: 0, a: 128 / 255 },
    });
  });
});

describe("RGB / RGBA and HSL / HSLA syntax varieties", () => {
  it("preserves typed HSL components, including case-insensitive syntax", () => {
    const first = parseHslComponents("hsl(10, 3%, 97%)");
    const second = parseHslComponents("hsl(210.5, 40.5%, 60.5%)");
    const third = parseHslComponents("HSL(301, 84%, 69%)");
    expect(first.ok && toHslWithAlpha(first.value, 0.5)).toBe("hsla(10, 3%, 97%, 0.5)");
    expect(second.ok && toHslWithAlpha(second.value, 0.5)).toBe("hsla(210.5, 40.5%, 60.5%, 0.5)");
    expect(third.ok && toHslWithAlpha(third.value, 0.5)).toBe("hsla(301, 84%, 69%, 0.5)");
  });

  it("supports comma and space syntax for rgb/rgba", () => {
    const comma = parseColor("rgba(255, 128, 0, 0.5)");
    const space = parseColor("rgb(255 128 0 / 0.5)");
    const percentAlpha = parseColor("rgb(255 128 0 / 50%)");

    expect(comma).toEqual({
      ok: true,
      value: { r: 255, g: 128, b: 0, a: 0.5 },
    });
    expect(space).toEqual({
      ok: true,
      value: { r: 255, g: 128, b: 0, a: 0.5 },
    });
    expect(percentAlpha).toEqual({
      ok: true,
      value: { r: 255, g: 128, b: 0, a: 0.5 },
    });
  });

  it("supports comma and space syntax for hsl/hsla with angle units", () => {
    const deg = parseColor("hsl(180deg, 100%, 50%)");
    const turn = parseColor("hsl(0.5turn 100% 50% / 0.8)");

    expect(deg).toEqual({
      ok: true,
      value: { r: 0, g: 255, b: 255, a: 1 },
    });
    expect(turn.ok && turn.value.a).toBe(0.8);
    expect(turn.ok && turn.value.r).toBe(0);
    expect(turn.ok && turn.value.g).toBe(255);
  });

  it("supports plain three-value space-separated syntax without slash", () => {
    expect(parseColor("rgb(255 0 0)")).toEqual({
      ok: true,
      value: { r: 255, g: 0, b: 0, a: 1 },
    });
    expect(parseColor("hsl(0 100% 50%)")).toEqual({
      ok: true,
      value: { r: 255, g: 0, b: 0, a: 1 },
    });
  });
});

describe("complete color tokens and alpha separators", () => {
  it.each([
    ["rgb(+255 0 -10 / +.5)", { r: 255, g: 0, b: 0, a: 0.5 }],
    ["rgb(1e2% 0% 0% / 5E1%)", { r: 255, g: 0, b: 0, a: 0.5 }],
    ["rgba(2.55e2, 0, 0, .5)", { r: 255, g: 0, b: 0, a: 0.5 }],
    ["rgb(300 -10 0 / 150%)", { r: 255, g: 0, b: 0, a: 1 }],
    ["rgb(0 0 0 / -1)", { r: 0, g: 0, b: 0, a: 0 }],
    ["hsl(+180DEG, 1e2%, 5e1%)", { r: 0, g: 255, b: 255, a: 1 }],
    ["hsl(200grad 100% 50% / 50%)", { r: 0, g: 255, b: 255, a: 0.5 }],
    ["hsl(3.141592653589793rad 100% 50%)", { r: 0, g: 255, b: 255, a: 1 }],
    ["hsla(-.5turn, 100%, 50%, .5)", { r: 0, g: 255, b: 255, a: 0.5 }],
    ["hsl(540 120% 50%)", { r: 0, g: 255, b: 255, a: 1 }],
    ["hsl(0 100 50 / .5)", { r: 255, g: 0, b: 0, a: 0.5 }],
  ])("preserves supported numbers in %s", (input, value) => {
    expect(parseColor(input)).toEqual({ ok: true, value });
  });

  it.each([
    "rgba(255, 0, 0 / 0.5)",
    "rgb(12abc, 0, 0)",
    "hsl(120foo, 50%, 50%)",
    "rgb(10px 20px 30px)",
    "rgb(255 0 0 0.5)",
    "rgba(255, 0, 0, 0.5junk)",
    "rgb(10junk% 0% 0%)",
    "rgb(255 0 0 / 50junk%)",
    "hsl(120foodeg 50% 50%)",
    "hsl(120 50junk% 50%)",
    "hsl(120 50% 50junk%)",
    "hsl(120 50px 50%)",
    "hsl(120 50% 50px)",
    "hsla(120, 50%, 50%, .5junk)",
    "hsl(120 50% 50% .5)",
    "hsla(120, 50%, 50% / .5)",
    "rgb(255 0 0 / .5 .6)",
    "rgb(255 0 0 / .5 / .6)",
    "rgb(255 0 0 /)",
    "rgb(255, 0, 0,)",
    "rgb(1e 0 0)",
    "rgb(1. 0 0)",
    "rgb(0x10 0 0)",
    "rgb(1e999 0 0)",
    "hsl(1e999turn 50% 50%)",
  ])("rejects malformed tokens or separators in %s", (input) => {
    const result = parseColor(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).not.toBe("");
  });
});

describe("invalid input handling", () => {
  it.each([
    "",
    "   ",
    "not-a-color",
    "red",
    "transparent",
    "blue",
    "#12345",
    "#gggggg",
    "rgb(255, 0)",
    "rgb(255, 0, 0, 0, 0)",
    "hsl(100)",
    "rgba(invalid)",
  ])("returns ok: false for %s", (input) => {
    const r = parseColor(input);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.length).toBeGreaterThan(0);
    }
  });
});

describe("relativeLuminance & contrastRatio", () => {
  const white: RgbaColor = { r: 255, g: 255, b: 255, a: 1 };
  const black: RgbaColor = { r: 0, g: 0, b: 0, a: 1 };

  it("calculates accurate relative luminance for extremes", () => {
    expect(relativeLuminance(white)).toBe(1);
    expect(relativeLuminance(black)).toBe(0);
  });

  it("yields 21 for black on white", () => {
    expect(contrastRatio(black, white)).toBe(21);
    expect(contrastRatio(white, black)).toBe(21);
  });

  it("yields 1 for identical colors", () => {
    expect(contrastRatio(white, white)).toBe(1);
    expect(contrastRatio(black, black)).toBe(1);
    const red: RgbaColor = { r: 255, g: 0, b: 0, a: 1 };
    expect(contrastRatio(red, red)).toBe(1);
  });

  it("yields approximately 4.48 for #777777 on white and fails normal-text AA", () => {
    const gray = parseColor("#777777");
    expect(gray.ok).toBe(true);
    if (!gray.ok) return;

    const ratio = contrastRatio(gray.value, white);
    expect(ratio).toBeCloseTo(4.48, 2);

    const rating = wcagRating(ratio);
    expect(rating.normalText.aa).toBe(false);
    expect(rating.normalText.aaa).toBe(false);
    expect(rating.largeText.aa).toBe(true);
    expect(rating.largeText.aaa).toBe(false);
  });

  it("composites translucent background onto white, then translucent foreground onto background", () => {
    const fg = parseColor("rgba(255, 255, 255, 0.5)");
    const bg = parseColor("rgba(0, 0, 0, 0.5)");
    expect(fg.ok).toBe(true);
    expect(bg.ok).toBe(true);
    if (!fg.ok || !bg.ok) return;

    // Background (black 0.5) over white (255) => rgb(127.5, 127.5, 127.5) with luminance ~0.214
    // Foreground (white 0.5) over that background => rgb(191.25, 191.25, 191.25) with luminance ~0.523
    // Correct contrast ratio is ~2.17 : 1
    // If incorrectly calculated as white (luminance 1) against gray (~0.214), ratio would be ~3.98 : 1
    const ratio = contrastRatio(fg.value, bg.value);
    expect(ratio).toBeCloseTo(2.17, 2);
    expect(ratio).not.toBeCloseTo(3.98, 1);
  });
});

describe("formatContrastRatio", () => {
  it.each([
    ["#FFFFFF", "#EB1717", "4.49"],
    ["#EE0707", "#FFFFFF", "4.49"],
    ["#575757", "#CCCCCC", "4.49"],
    ["#959595", "#FFFFFF", "2.99"],
    ["#176363", "#FFFFFF", "6.99"],
    ["#FFFFFF", "#0A0B0F", "19.66"],
  ])("truncates %s on %s to %s, so it never reads above a threshold the pair misses", (fg, bg, shown) => {
    const text = parseColor(fg);
    const surface = parseColor(bg);
    expect(text.ok && surface.ok).toBe(true);
    if (!text.ok || !surface.ok) return;
    expect(formatContrastRatio(contrastRatio(text.value, surface.value))).toBe(shown);
  });

  it.each([
    [21, "21.00"],
    [1, "1.00"],
    [4.5, "4.50"],
    [4.56, "4.56"],
    [4.499327326513352, "4.49"],
  ])("formats %s as %s", (ratio, shown) => {
    expect(formatContrastRatio(ratio)).toBe(shown);
  });
});

describe("wcagRating", () => {
  it("correctly distinguishes normal and large text", () => {
    // 4.48: fails normal AA (<4.5), passes large AA (>=3)
    const r448 = wcagRating(4.48);
    expect(r448.normalText.aa).toBe(false);
    expect(r448.normalText.aaa).toBe(false);
    expect(r448.largeText.aa).toBe(true);
    expect(r448.largeText.aaa).toBe(false);

    // 4.6: passes normal AA (>=4.5) and large AAA (>=4.5), fails normal AAA (<7)
    const r46 = wcagRating(4.6);
    expect(r46.normalText.aa).toBe(true);
    expect(r46.normalText.aaa).toBe(false);
    expect(r46.largeText.aa).toBe(true);
    expect(r46.largeText.aaa).toBe(true);

    // 7.5: passes everything
    const r75 = wcagRating(7.5);
    expect(r75.normalText.aa).toBe(true);
    expect(r75.normalText.aaa).toBe(true);
    expect(r75.largeText.aa).toBe(true);
    expect(r75.largeText.aaa).toBe(true);

    // 2.5: fails everything
    const r25 = wcagRating(2.5);
    expect(r25.normalText.aa).toBe(false);
    expect(r25.normalText.aaa).toBe(false);
    expect(r25.largeText.aa).toBe(false);
    expect(r25.largeText.aaa).toBe(false);
  });
});
