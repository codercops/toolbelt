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

describe("toCSV", () => {
  it.each(["constructor", "toString", "__proto__"])(
    "leaves missing %s cells empty while retaining own values",
    (key) => {
      const result = toCSV(`[{"driver":"Hamilton","${key}":"Mercedes"},{"driver":"Alonso"}]`);
      expect(result).toEqual({ ok: true, value: `driver,${key}\nHamilton,Mercedes\nAlonso,` });
    },
  );

  it("preserves falsy own values for names inherited from Object.prototype", () => {
    const result = toCSV('[{"constructor":0,"toString":false,"__proto__":""},{"constructor":null}]');
    expect(result).toEqual({ ok: true, value: "constructor,toString,__proto__\n0,false,\n,," });
  });

  it("preserves header order and quotes own values with special names", () => {
    const result = toCSV('[{"toString":"a,b"},{"__proto__":{"a":1},"constructor":"say \\\"hi\\\""}]');
    expect(result).toEqual({
      ok: true,
      value: 'toString,__proto__,constructor\n"a,b",,\n,"{""a"":1}","say ""hi"""',
    });
  });

  it("keeps empty cells for null and primitive rows mixed with objects", () => {
    const result = toCSV('[{"a":1},null,5,"text",true,false]');
    expect(result).toEqual({ ok: true, value: "a\n1\n\n\n\n\n" });
  });

  it("retains own array cells when mixed with object rows", () => {
    const result = toCSV('[{"0":"first","length":"size"},["second"]]');
    expect(result).toEqual({ ok: true, value: "0,length\nfirst,size\nsecond,1" });
  });

  it("keeps primitive-only and empty array output unchanged", () => {
    expect(toCSV('[null,5,"a,b",false]')).toEqual({ ok: true, value: '\n5\n"a,b"\nfalse' });
    expect(toCSV("[]")).toEqual({ ok: true, value: "" });
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

  it("sanitizes keys according to XML tag rules", () => {
    const input = JSON.stringify({
      "bad key": 1,
      "1x": 2,
      "@type": "Person",
      "$ref": "#/a",
      "a:b": 3,
      "-a": 4,
      "first-name": "Ada",
      "user.id": 42,
      _id: "abc",
      "": "empty",
      café: "latte",
    });
    const result = toXML(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toContain("<bad_key>1</bad_key>");
    expect(result.value).toContain("<_1x>2</_1x>");
    expect(result.value).toContain("<_type>Person</_type>");
    expect(result.value).toContain("<_ref>#/a</_ref>");
    expect(result.value).toContain("<a_b>3</a_b>");
    expect(result.value).toContain("<_-a>4</_-a>");
    expect(result.value).toContain("<first-name>Ada</first-name>");
    expect(result.value).toContain("<user.id>42</user.id>");
    expect(result.value).toContain("<_id>abc</_id>");
    expect(result.value).toContain("<item>empty</item>");
    expect(result.value).toContain("<caf_>latte</caf_>");
  });

  it("sanitizes array element tag names derived from keys", () => {
    const result = toXML('{"my tags":["a","b"]}');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toContain("  <my_tag>a</my_tag>\n  <my_tag>b</my_tag>");
  });
});

describe("toYAML writes numbers with an exponent as YAML 1.1 floats", () => {
  // PyYAML needs a dot and a signed exponent to read a float, so it loads
  // "1e3" as a string. The numbers keep their JSON digits otherwise.
  const yamlOf = (json: string): string => {
    const out = toYAML(json);
    if (!out.ok) throw new Error(out.error.message);
    return out.value;
  };

  it("adds the missing dot and sign, as in the example from the issue", () => {
    expect(yamlOf('{"num":1e3,"tiny":1e-7}')).toBe("num: 1.0e+3\ntiny: 1.0e-7\n");
  });

  it.each([
    ["1.5e3", "1.5e+3"],
    ["1E3", "1.0E+3"],
    ["2e+5", "2.0e+5"],
    ["-1e3", "-1.0e+3"],
    ["1.0e3", "1.0e+3"],
    ["1.5e-3", "1.5e-3"],
    ["1e-7", "1.0e-7"],
    ["1.0E-3", "1.0E-3"],
    ["1.0e+3", "1.0e+3"],
    ["-2.5E+10", "-2.5E+10"],
    ["1e03", "1.0e+03"],
    ["0e0", "0.0e+0"],
  ])("writes %s as %s", (written, expected) => {
    expect(yamlOf(`{"num":${written}}`)).toBe(`num: ${expected}\n`);
  });

  it("keeps every digit of a long number", () => {
    expect(yamlOf('{"num":1.2345678901234567890123e5}')).toBe("num: 1.2345678901234567890123e+5\n");
    expect(yamlOf('{"num":12345678901234567890123e5}')).toBe("num: 12345678901234567890123.0e+5\n");
  });

  it.each(["12", "1.5", "-0.5", "0", "12345678901234567890", "-9007199254740993", "0.1"])(
    "leaves %s unchanged",
    (written) => {
      expect(yamlOf(`{"num":${written}}`)).toBe(`num: ${written}\n`);
    },
  );

  it("fixes numbers inside arrays and nested objects", () => {
    expect(yamlOf('{"list":[1e3,2],"deep":{"items":[{"val":5E-2}]}}')).toBe(
      "list:\n  - 1.0e+3\n  - 2\ndeep:\n  items:\n    - val: 5.0E-2\n",
    );
  });

  it("does not touch strings that look like exponent numbers", () => {
    expect(yamlOf('{"s":"1e3"}')).toBe('s: "1e3"\n');
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

  it("escapes runs of single quotes", () => {
    expect(escapeForCode('{"a":"\'\'\'\'\'"}', "python")).toBe("'''{\"a\":\"\\'\\'\\'\\'\\'\"}'''");
    expect(escapeForCode('{"a":"\'\'\'\'\'\'\'\'"}', "python")).toBe("'''{\"a\":\"\\'\\'\\'\\'\\'\\'\\'\\'\"}'''");
    expect(escapeForCode("it's'", "python")).toBe("'''it\\'s\\''''");
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

describe("toYAML escapes control characters", () => {
  it("escapes SOH and bell characters", () => {
    const out = toYAML('{"soh":"\\u0001","bell":"a\\u0007b"}');
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value).toContain('soh: "\\x01"');
    expect(out.value).toContain('bell: "a\\x07b"');
  });

  it("escapes ANSI color codes", () => {
    const out = toYAML('{"log":"\\u001b[31mred\\u001b[0m"}');
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value).toBe('log: "\\x1B[31mred\\x1B[0m"\n');
  });

  it("escapes boundary control characters and non-printable unicode", () => {
    const input = JSON.stringify({
      nullChar: "\u0000",
      del: "\u007F",
      pad: "\u0080",
      nel: "\u0085",
      apc: "\u009F",
      ls: "\u2028",
      ps: "\u2029",
      nonChar: "\uFFFE",
    });
    const out = toYAML(input);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value).toContain('nullChar: "\\x00"');
    expect(out.value).toContain('del: "\\x7F"');
    expect(out.value).toContain('pad: "\\x80"');
    expect(out.value).toContain('nel: "\\x85"');
    expect(out.value).toContain('apc: "\\x9F"');
    expect(out.value).toContain('ls: "\\u2028"');
    expect(out.value).toContain('ps: "\\u2029"');
    expect(out.value).toContain('nonChar: "\\uFFFE"');
  });

  it("escapes control characters in keys", () => {
    const out = toYAML('{"a\\u0001b":1}');
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value).toBe('"a\\x01b": 1\n');
  });

  it("preserves standard whitespace escapes and normal strings", () => {
    const out = toYAML('{"v":"x\\ty\\nz"}');
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value).toBe('v: "x\\ty\\nz"\n');

    const normal = toYAML('{"v":"hello"}');
    expect(normal.ok).toBe(true);
    if (!normal.ok) return;
    expect(normal.value).toBe("v: hello\n");
  });
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

/* -----------------------------------------------------------------------
 * sortKeys — __proto__ key preservation (issue #279)
 * All inputs are JSON strings; assertions parse the returned JSON string.
 * We never use JS object literals with an unquoted __proto__ property because
 * that triggers JS prototype semantics instead of testing the JSON key.
 * ----------------------------------------------------------------------- */
describe("sortKeys __proto__ preservation", () => {
  // ── Test A: primitive __proto__ value ──────────────────────────────────
  it("A: preserves __proto__ with a primitive value and does not replace the whole output", () => {
    const input = '{"__proto__": 5, "z": 1}';
    const result = sortKeys(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Must be valid JSON
    const parsed = JSON.parse(result.value) as Record<string, unknown>;
    expect(typeof parsed).toBe("object");
    expect(parsed).not.toBeNull();

    // __proto__ must be an own property
    expect(Object.hasOwn(parsed, "__proto__")).toBe(true);
    expect(parsed["__proto__"]).toBe(5);
    expect(parsed["z"]).toBe(1);

    // Sorting must not replace the whole output with just the value 5
    expect(result.value).not.toBe("5");
  });

  // ── Test B: object-valued __proto__ ────────────────────────────────────
  it("B: preserves __proto__ with an object value without changing the prototype", () => {
    const input = '{"__proto__": {"admin": true}, "b": 1, "a": 2}';
    const result = sortKeys(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const parsed = JSON.parse(result.value) as Record<string, unknown>;
    expect(Object.hasOwn(parsed, "__proto__")).toBe(true);

    // Nested admin property must survive
    const proto = parsed["__proto__"] as Record<string, unknown>;
    expect(proto).toBeTruthy();
    expect(proto["admin"]).toBe(true);

    // Ordinary keys are still present
    expect(parsed["a"]).toBe(2);
    expect(parsed["b"]).toBe(1);

    // Parsed object's prototype must NOT be changed to the supplied __proto__ value
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  });

  // ── Test C: nested __proto__ ──────────────────────────────────────────
  it("C: preserves nested __proto__ and sorts sibling keys alphabetically", () => {
    const input = '{"outer": {"__proto__": 7, "z": 3, "a": 1}}';
    const result = sortKeys(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const parsed = JSON.parse(result.value) as { outer: Record<string, unknown> };
    const outer = parsed["outer"];
    expect(Object.hasOwn(outer, "__proto__")).toBe(true);
    expect(outer["__proto__"]).toBe(7);
    expect(outer["a"]).toBe(1);
    expect(outer["z"]).toBe(3);
  });

  // ── Test D: __proto__ inside an array ─────────────────────────────────
  it("D: preserves __proto__ inside an array element", () => {
    const input = '[{"__proto__": false, "z": 2, "a": 1}]';
    const result = sortKeys(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const parsed = JSON.parse(result.value) as unknown[];
    expect(Array.isArray(parsed)).toBe(true);
    const elem = parsed[0] as Record<string, unknown>;
    expect(typeof elem).toBe("object");
    expect(Object.hasOwn(elem, "__proto__")).toBe(true);
    expect(elem["__proto__"]).toBe(false);
    expect(elem["a"]).toBe(1);
    expect(elem["z"]).toBe(2);
  });

  // ── Test E: all JSON value types for __proto__ ─────────────────────────
  it.each([
    ["string",  '{"__proto__": "hello", "x": 1}',              "hello"],
    ["number",  '{"__proto__": 42,      "x": 1}',              42    ],
    ["boolean", '{"__proto__": true,    "x": 1}',              true  ],
    ["null",    '{"__proto__": null,    "x": 1}',              null  ],
    ["array",   '{"__proto__": [1,2],   "x": 1}',              null  ], // special-cased below
    ["object",  '{"__proto__": {"k":9}, "x": 1}',              null  ], // special-cased below
  ])("E: preserves __proto__ with a %s value through sort and round-trip", (kind, input, expected) => {
    const result = sortKeys(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const parsed = JSON.parse(result.value) as Record<string, unknown>;
    expect(Object.hasOwn(parsed, "__proto__")).toBe(true);
    if (kind === "array") {
      expect(Array.isArray(parsed["__proto__"])).toBe(true);
      expect((parsed["__proto__"] as unknown[])).toEqual([1, 2]);
    } else if (kind === "object") {
      expect(typeof parsed["__proto__"]).toBe("object");
      expect((parsed["__proto__"] as Record<string, unknown>)["k"]).toBe(9);
    } else {
      expect(parsed["__proto__"]).toBe(expected);
    }
    expect(result.value).not.toBe(String(expected));
  });

  // ── Test F: ordinary objects still sort alphabetically ─────────────────
  it("F: ordinary objects still sort alphabetically, including nested and array-embedded", () => {
    const input = '{"z": 3, "a": 1, "m": {"y": 9, "b": 2}, "list": [{"q": 0, "c": 7}]}';
    const result = sortKeys(input, 2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const parsed = JSON.parse(result.value) as Record<string, unknown>;
    const keys = Object.keys(parsed);
    expect(keys).toEqual([...keys].sort());
    const m = parsed["m"] as Record<string, unknown>;
    expect(Object.keys(m)).toEqual([...Object.keys(m)].sort());
  });

  // ── Test G: invalid JSON still returns error result ────────────────────
  it("G: invalid JSON returns an error Result instead of throwing", () => {
    const result = sortKeys('{"bad": }');
    expect(result.ok).toBe(false);
  });

  // ── Test H: both indentation modes work with __proto__ ─────────────────
  it("H: indent=2 and indent=4 both preserve __proto__ correctly", () => {
    const input = '{"__proto__": 5, "z": 1}';

    const r2 = sortKeys(input, 2);
    expect(r2.ok).toBe(true);
    if (r2.ok) {
      const p2 = JSON.parse(r2.value) as Record<string, unknown>;
      expect(Object.hasOwn(p2, "__proto__")).toBe(true);
      expect(p2["__proto__"]).toBe(5);
      // 2-space indentation
      expect(r2.value).toContain("  ");
    }

    const r4 = sortKeys(input, 4);
    expect(r4.ok).toBe(true);
    if (r4.ok) {
      const p4 = JSON.parse(r4.value) as Record<string, unknown>;
      expect(Object.hasOwn(p4, "__proto__")).toBe(true);
      expect(p4["__proto__"]).toBe(5);
      // 4-space indentation
      expect(r4.value).toContain("    ");
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
