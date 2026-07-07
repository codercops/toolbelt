import { describe, it, expect } from "vitest";
import {
  format,
  minify,
  toCSV,
  toYAML,
  toXML,
  toTypeScript,
  sortKeys,
  escapeForCode,
  parseJson5Compat,
  diffLines,
} from "../json-utils";

const BIG = '{"id":12345678901234567890,"pi":3.141592653589793238,"n":42}';

describe("lossless numbers", () => {
  it("preserves large integers and long decimals when formatting", () => {
    const r = format(BIG, 2);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toContain("12345678901234567890");
      expect(r.value).toContain("3.141592653589793238");
      expect(r.value).not.toContain("12345678901234567000");
    }
  });

  it("preserves large integers when minifying", () => {
    const r = minify(BIG);
    expect(r.ok && r.value).toBe('{"id":12345678901234567890,"pi":3.141592653589793238,"n":42}');
  });

  it("preserves big numbers through CSV, YAML, XML, and sortKeys", () => {
    const arr = '[{"id":12345678901234567890}]';
    const csv = toCSV(arr);
    expect(csv.ok && csv.value.includes("12345678901234567890")).toBe(true);

    const yaml = toYAML(BIG);
    expect(yaml.ok && yaml.value.includes("12345678901234567890")).toBe(true);

    const xml = toXML(BIG);
    expect(xml.ok && xml.value.includes("12345678901234567890")).toBe(true);

    const sorted = sortKeys(BIG);
    expect(sorted.ok && sorted.value.includes("12345678901234567890")).toBe(true);
  });

  it("infers number type for big values in TypeScript output", () => {
    const ts = toTypeScript(BIG);
    expect(ts.ok && /id\??: number/.test(ts.value)).toBe(true);
  });
});

describe("escapeForCode rust", () => {
  it("produces a raw string that does not close early on a leading-# value", () => {
    const out = escapeForCode('{"color":"#fff"}', "rust");
    // Needs at least two hashes so the '"#' inside the body cannot terminate it.
    expect(out.startsWith('r##"')).toBe(true);
    expect(out.endsWith('"##')).toBe(true);
  });

  it("uses a single hash when the body has no quote-hash sequence", () => {
    const out = escapeForCode('{"a":1}', "rust");
    expect(out).toBe('r#"{"a":1}"#');
  });
});

describe("parseJson5Compat indentation", () => {
  it("does not mangle double spaces inside string values at 4-space indent", () => {
    const r = parseJson5Compat('{"a":"two  spaces"}', 4);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toContain('"two  spaces"');
      expect(r.value).toContain('    "a"'); // 4-space indent applied to the key
    }
  });
});

describe("diffLines large-input guard", () => {
  it("returns a usable diff for very large inputs without hanging", () => {
    const a = Array.from({ length: 6000 }, (_, i) => `line ${i}`).join("\n");
    const b = a + "\nextra";
    const rows = diffLines(a, b);
    expect(rows.some((r) => r.type === "add")).toBe(true);
  });
});
