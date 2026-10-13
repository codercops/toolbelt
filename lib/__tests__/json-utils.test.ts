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
describe("escapeForCode python", () => {
  it("preserves backslashes in JSON", () => {
    const input = '{"path":"C:\\\\temp"}';
    const out = escapeForCode(input, "python");

    expect(out).toBe("'''{\"path\":\"C:\\\\\\\\temp\"}'''");
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

describe("toYAML quotes strings YAML would read as other types", () => {
  it.each([
    [".5", '".5"'],
    ["+1", '"+1"'],
    ["0x1F", '"0x1F"'],
    ["0o17", '"0o17"'],
    [".inf", '".inf"'],
    [".NaN", '".NaN"'],
    ["2026-04-15", '"2026-04-15"'],
    ["2026-04-15T10:00:00Z", '"2026-04-15T10:00:00Z"'],
  ])("quotes %s", (input, expected) => {
    const out = toYAML(JSON.stringify({ a: input }));
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.value).toBe(`a: ${expected}\n`);
  });

  it.each(["1.4.0", "v2", "hello"])("leaves %s unquoted", (input) => {
    const out = toYAML(JSON.stringify({ a: input }));
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.value).toBe(`a: ${input}\n`);
  });
});

describe("toTypeScript array items", () => {
  it("merges array items into one interface with optional keys", () => {
    const ts = toTypeScript('{"users":[{"id":1},{"id":2,"name":"x"}]}');
    expect(ts.ok && ts.value).toBe(
      "export interface User {\n  id: number;\n  name?: string;\n}\n\nexport interface Root {\n  users: User[];\n}",
    );
  });

  it("merges nested objects inside array items", () => {
    const ts = toTypeScript('{"items":[{"a":{"x":1}},{"a":{"y":2}}]}');
    expect(ts.ok && ts.value).toBe(
      "export interface A {\n  x?: number;\n  y?: number;\n}\n\nexport interface Item {\n  a: A;\n}\n\nexport interface Root {\n  items: Item[];\n}",
    );
  });

  it("merges arrays of objects inside array items", () => {
    const ts = toTypeScript('{"users":[{"tags":[{"n":1}]},{"tags":[{"m":"x"}]}]}');
    expect(ts.ok && ts.value).toContain("export interface Tag {\n  n?: number;\n  m?: string;\n}");
    expect(ts.ok && ts.value).not.toContain("Tag2");
  });

  it("keeps the element type when some items have an empty array", () => {
    const last = toTypeScript('{"users":[{"id":1,"tags":["a"]},{"id":2,"tags":[]}]}');
    expect(last.ok && last.value).toContain("tags: string[];");
    const first = toTypeScript('{"posts":[{"comments":[]},{"comments":[{"by":"x"}]}]}');
    expect(first.ok && first.value).toContain("comments: Comment[];");
  });

  it("turns keys with different types into a union", () => {
    const ts = toTypeScript('[{"id":1},{"id":"x"}]');
    expect(ts.ok && ts.value).toContain("id: number | string;");
  });
});
