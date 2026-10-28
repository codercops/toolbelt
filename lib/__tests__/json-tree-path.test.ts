import { describe, expect, it } from "vitest";
import { buildJsonTreePath, type JsonPathSegment } from "../json-tree-path";

describe("buildJsonTreePath", () => {
  it("uses $ for the root and dot notation for simple nested properties", () => {
    expect(buildJsonTreePath([])).toBe("$");
    expect(
      buildJsonTreePath([
        { type: "property", key: "users" },
        { type: "property", key: "profile" },
        { type: "property", key: "email" },
      ])
    ).toBe("$.users.profile.email");
  });

  it("uses brackets for array indexes within nested objects and arrays", () => {
    const path: JsonPathSegment[] = [
      { type: "property", key: "users" },
      { type: "index", index: 2 },
      { type: "property", key: "emails" },
      { type: "index", index: 0 },
    ];

    expect(buildJsonTreePath(path)).toBe("$.users[2].emails[0]");
  });

  it.each([
    ["", '$[""]'],
    ["first.last", '$["first.last"]'],
    ["with[brackets]", '$["with[brackets]"]'],
    ['a"b', '$["a\\\"b"]'],
    ["a\\b", '$["a\\\\b"]'],
    ["123", '$["123"]'],
    ["café", '$["café"]'],
    ["鍵", '$["鍵"]'],
    ["line\nbreak", '$["line\\nbreak"]'],
  ])("quotes and escapes property key %j", (key, expected) => {
    expect(buildJsonTreePath([{ type: "property", key }])).toBe(expected);
  });

  it("distinguishes numeric object keys from array indexes", () => {
    expect(
      buildJsonTreePath([
        { type: "property", key: "0" },
        { type: "index", index: 0 },
      ])
    ).toBe('$["0"][0]');
  });
});
