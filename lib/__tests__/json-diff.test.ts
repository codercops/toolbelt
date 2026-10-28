import { describe, expect, it } from "vitest";
import { compareJson, DIFF_INPUT_LIMIT } from "../json-diff";

describe("structural JSON diff", () => {
  it("ignores formatting, key order and equivalent numeric representations", () => {
    expect(compareJson('{"a":1,"b":1.00}', '{ "b":1e0, "a":1 }').changes).toEqual([]);
    expect(compareJson('{"a":1,"b":2}', '{"b":2,"a":1}', false).changes[0].path).toBe("$");
  });
  it("distinguishes missing, null and value types", () => {
    expect(compareJson('{"a":null,"b":1}', '{"b":"1","c":null}').changes).toEqual([
      { type: "Removed", path: "$.a", before: "null" },
      { type: "Changed", path: "$.b", before: "1", after: '"1"' },
      { type: "Added", path: "$.c", after: "null" },
    ]);
  });
  it("compares arrays by index and escapes nested property names", () => {
    expect(compareJson('{"a.b":[1,2]}', '{"a.b":[0,1,2]}').changes.map(c => c.path)).toEqual(['$["a.b"][0]', '$["a.b"][1]', '$["a.b"][2]']);
    for (const key of ["", "a b", 'a"b', "a\\b", "a[b]"]) {
      expect(compareJson(JSON.stringify({[key]:1}), JSON.stringify({[key]:2})).changes[0].path).toBe(`$[${JSON.stringify(key)}]`);
    }
  });
  it("preserves lossless numbers and precise decimals", () => {
    const result = compareJson('[9007199254740992,0.1234567890123456789]', '[9007199254740993,0.1234567890123456788]');
    expect(result.changes).toHaveLength(2);
    expect(result.changes[0].after).toBe("9007199254740993");
    expect(result.changes[1].before).toBe("0.1234567890123456789");
  });
  it.each([['null','{}'], ['[]','{}'], ['true','false'], ['1','"1"']])("handles primitive roots and containers %s", (a,b) => {
    expect(compareJson(a,b).changes[0].path).toBe("$");
  });
  it("rejects invalid and oversized documents without changes", () => {
    expect(compareJson('{}', '{').errors[0]).toContain("Updated JSON");
    expect(compareJson('x'.repeat(DIFF_INPUT_LIMIT + 1), '{}').changes).toEqual([]);
  });
  it("reports truncation explicitly", () => {
    const result = compareJson(JSON.stringify(Array(501).fill(0)), JSON.stringify(Array(501).fill(1)));
    expect(result.changes).toHaveLength(500);
    expect(result.truncated).toBe(true);
  });
});
