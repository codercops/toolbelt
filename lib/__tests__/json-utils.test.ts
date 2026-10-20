import { describe, it, expect } from "vitest";
import ts from "typescript";
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
  validate,
} from "../json-utils";

const BIG = '{"id":12345678901234567890,"pi":3.141592653589793238,"n":42}';

describe("JSON Formatter Error Locations", () => {
  it("extracts correct location for unquoted values", () => {
    const result = validate('{"a": x}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.line).toBe(1);
      expect(result.error.column).toBe(7);
    }
  });

  it("extracts correct location for multi-line JSON", () => {
    const input = '{"a": 1,\n"b": tru\n}';
    const result = validate(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.line).toBe(2);
      expect(result.error.column).toBe(6);
    }
  });

  it("keeps original location for duplicate keys with trailing comma", () => {
    const result = validate('{"a":1,"a":2,}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.line).toBe(1);
      expect(result.error.column).toBe(14);
    }
  });

  it("extracts correct location for unexpected end of input", () => {
    const result = validate('{"a": ');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.line).toBe(1);
      expect(result.error.column).toBe(7);
    }
  });

  it("extracts correct location for undefined in array", () => {
    const result = validate('[1, 2, undefined]');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.line).toBe(1);
      expect(result.error.column).toBe(8);
    }
  });

  it("keeps existing correct locations intact", () => {
    const result = validate('{"a":1,}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.line).toBe(1);
      expect(result.error.column).toBe(8);
    }
  });
});

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

describe("toXML", () => {
  it("wraps a top-level array in a root element", () => {
    const result = toXML("[1,2]");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toContain(
      "<root>\n  <rootItem>1</rootItem>\n  <rootItem>2</rootItem>\n</root>",
    );
  });

  it("gives an empty element for an empty top-level array", () => {
    const result = toXML("[]");
    expect(result.ok && result.value).toContain("<root/>");
  });

  it("gives an empty element for an empty nested array", () => {
    const result = toXML('{"a":[]}');
    expect(result.ok && result.value).toContain("<a/>");
  });

  it("preserves structure for an array of arrays", () => {
    const result = toXML('{"a":[[1,2],[3]]}');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).not.toContain("<a>");
    expect(result.value).toContain(
      [
        "  <aItem>",
        "    <aItemItem>1</aItemItem>",
        "    <aItemItem>2</aItemItem>",
        "  </aItem>",
        "  <aItem>",
        "    <aItemItem>3</aItemItem>",
        "  </aItem>",
      ].join("\n"),
    );
  });

  it("does not change output for objects with nested arrays of objects", () => {
    const result = toXML('{"users":[{"id":1},{"id":2}]}');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).not.toContain("<users>");
    expect(result.value).toContain(
      [
        "  <user>",
        "    <id>1</id>",
        "  </user>",
        "  <user>",
        "    <id>2</id>",
        "  </user>",
      ].join("\n"),
    );
  });

  it("writes array-of-values inside an object as items directly into parent", () => {
    const result = toXML('{"tags":["x","y"]}');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).not.toContain("<tags>");
    expect(result.value).toContain("  <tag>x</tag>\n  <tag>y</tag>");
  });

  it("wraps a top-level array of arrays, each sub-array in its own element", () => {
    const result = toXML("[[1,2],[3]]");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toContain(
      [
        "<root>",
        "  <rootItem>",
        "    <rootItemItem>1</rootItemItem>",
        "    <rootItemItem>2</rootItemItem>",
        "  </rootItem>",
        "  <rootItem>",
        "    <rootItemItem>3</rootItemItem>",
        "  </rootItem>",
        "</root>",
      ].join("\n"),
    );
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
    ["1:30", '"1:30"'],
    ["12:30:45", '"12:30:45"'],
    ["1:30.5", '"1:30.5"'],
    ["1_000", '"1_000"'],
    ["1_000.5", '"1_000.5"'],
    ["0x_1F", '"0x_1F"'],
    ["0b101", '"0b101"'],
    ["+0b101", '"+0b101"'],
    ["0b1010_0111", '"0b1010_0111"'],
    ["y", '"y"'],
    ["Y", '"Y"'],
    ["n", '"n"'],
    ["N", '"N"'],
    ["=", '"="'],
    ["<<", '"<<"'],
    ["2001-1-1 1:00:00", '"2001-1-1 1:00:00"'],
    ["1__000", '"1__000"'],
    ["1000_", '"1000_"'],
    ["1.0_0", '"1.0_0"'],
    [".5_0", '".5_0"'],
    ["0b_101", '"0b_101"'],
    ["0b101_", '"0b101_"'],
    ["1_0:30", '"1_0:30"'],
    ["1:30.", '"1:30."'],
  ])("quotes %s", (input, expected) => {
    const out = toYAML(JSON.stringify({ a: input }));
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.value).toBe(`a: ${expected}\n`);
  });

  it("quotes YAML merge keys", () => {
    const out = toYAML('{"<<":"x"}');
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.value).toBe('"<<": x\n');
  });

  it.each(["1.4.0", "v2", "hello", "1,000", "_1", "0b2", "a:b"])(
    "leaves %s unquoted",
    (input) => {
      const out = toYAML(JSON.stringify({ a: input }));
      expect(out.ok).toBe(true);
      if (out.ok) expect(out.value).toBe(`a: ${input}\n`);
    },
  );
});

describe("toYAML empty array items", () => {
  it.each([
    ["[{}]", "- {}\n"],
    ["[[]]", "- []\n"],
    ['{"items":[{},{"a":1}]}', "items:\n  - {}\n  - a: 1\n"],
    ["[[1,2]]", "-\n  - 1\n  - 2\n"],
    ['[{"a":{"b":1}}]', "- a:\n    b: 1\n"],
  ])("converts %s", (input, expected) => {
    const out = toYAML(input);
    expect(out.ok && out.value).toBe(expected);
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
    const tsResult = toTypeScript('[{"id":1},{"id":"x"}]');
    expect(tsResult.ok && tsResult.value).toContain("id: number | string;");
  });

  it("prefixes interface names starting with a digit with an underscore", () => {
    const single = toTypeScript('{"404":{"msg":"x"}}');
    expect(single.ok).toBe(true);
    if (single.ok) {
      expect(single.value).toContain("export interface _404 {\n  msg: string;\n}");
      expect(single.value).toContain('"404": _404;');
      const transpile = ts.transpileModule(single.value, { reportDiagnostics: true });
      expect(transpile.diagnostics ?? []).toHaveLength(0);
    }

    const multi = toTypeScript(
      '{"2fa":{"enabled":true},"1":{"name":"a"},"2":{"name":"b"},"2fas":[{"a":1}]}',
    );
    expect(multi.ok).toBe(true);
    if (multi.ok) {
      expect(multi.value).toContain("export interface _2fa");
      expect(multi.value).toContain("export interface _1");
      expect(multi.value).toContain("export interface _2");
      const transpile = ts.transpileModule(multi.value, { reportDiagnostics: true });
      expect(transpile.diagnostics ?? []).toHaveLength(0);
    }
  });

  it("gives nested objects a free name when the JSON is a top-level array", () => {
    const single = toTypeScript('[{"root":{"x":1}}]');
    expect(single.ok).toBe(true);
    if (single.ok) {
      expect(single.value).toContain("export type Root = RootItem[];");
      expect(single.value).toContain("export interface Root2 {\n  x: number;\n}");
      expect(single.value).toContain("export interface RootItem {\n  root: Root2;\n}");
      const transpile = ts.transpileModule(single.value, { reportDiagnostics: true });
      expect(transpile.diagnostics ?? []).toHaveLength(0);
    }

    const deeper = toTypeScript('[{"a":{"root":{"x":1}}}]');
    expect(deeper.ok).toBe(true);
    if (deeper.ok) {
      expect(deeper.value).toContain("export type Root = RootItem[];");
      expect(deeper.value).toContain("export interface Root2 {\n  x: number;\n}");
      expect(deeper.value).toContain("root: Root2;");
      const transpile = ts.transpileModule(deeper.value, { reportDiagnostics: true });
      expect(transpile.diagnostics ?? []).toHaveLength(0);
    }

    const uppercase = toTypeScript('[{"Root":{"x":1}}]');
    expect(uppercase.ok).toBe(true);
    if (uppercase.ok) {
      expect(uppercase.value).toContain("export type Root = RootItem[];");
      expect(uppercase.value).toContain("export interface Root2 {\n  x: number;\n}");
      expect(uppercase.value).toContain("Root: Root2;");
      const transpile = ts.transpileModule(uppercase.value, { reportDiagnostics: true });
      expect(transpile.diagnostics ?? []).toHaveLength(0);
    }

    const topLevelObj = toTypeScript('{"root":{"x":1}}');
    expect(topLevelObj.ok).toBe(true);
    if (topLevelObj.ok) {
      expect(topLevelObj.value).toBe(
        "export interface Root2 {\n  x: number;\n}\n\nexport interface Root {\n  root: Root2;\n}",
      );
      const transpile = ts.transpileModule(topLevelObj.value, { reportDiagnostics: true });
      expect(transpile.diagnostics ?? []).toHaveLength(0);
    }
  });
});

describe("duplicate keys", () => {
  const DUP = '{"a": 1, "a": 2}';

  it("validate() rejects a duplicate key", () => {
    const result = validate(DUP);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Duplicate key");
    }
  });

  it("conversions surface a duplicate-key error instead of throwing", () => {
    const results = [toCSV(DUP), toTypeScript(DUP), toYAML(DUP), toXML(DUP), sortKeys(DUP)];
    for (const result of results) {
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("Duplicate key");
      }
    }
  });
});
