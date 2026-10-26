import { describe, expect, it } from "vitest";
import { compileRegex, findMatches, replacePreview } from "../regex-utils";

function compile(pattern: string, flags = "g"): RegExp {
  const result = compileRegex(pattern, flags);
  if (!result.ok) throw new Error(`/${pattern}/${flags} should compile: ${result.error}`);
  return result.regex;
}

describe("compileRegex", () => {
  it("compiles a valid pattern with flags", () => {
    const result = compileRegex("a+", "gi");
    expect(result.ok && result.regex.flags).toBe("gi");
  });

  it("returns ok: false with the reason for an invalid pattern", () => {
    expect(compileRegex("(", "")).toEqual({ ok: false, error: "Invalid pattern: Unterminated group" });
  });

  it.each(["x", "gg", "gq"])("returns ok: false for the flags %s", (flags) => {
    const result = compileRegex("a", flags);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain(`Invalid flags "${flags}"`);
  });
});

describe("findMatches", () => {
  it("returns every match with its position and groups", () => {
    const { matches, truncated } = findMatches(compile("(\\d)(x)?"), "a1b2x");
    expect(truncated).toBe(false);
    expect(matches).toEqual([
      { text: "1", index: 1, end: 2, groups: ["1", undefined], named: {} },
      { text: "2x", index: 3, end: 5, groups: ["2", "x"], named: {} },
    ]);
  });

  it("returns named groups", () => {
    const { matches } = findMatches(compile("(?<year>\\d{4})-(?<month>\\d{2})"), "on 2026-10 and 2027-01");
    expect(matches.map((match) => match.named)).toEqual([
      { year: "2026", month: "10" },
      { year: "2027", month: "01" },
    ]);
  });

  it.each([
    ["a*", "baab", 4],
    ["^", "one\ntwo", 1],
    ["(?:)", "abc", 4],
  ])("terminates on the zero-length pattern %s", (pattern, text, count) => {
    expect(findMatches(compile(pattern), text).matches).toHaveLength(count);
  });

  it("steps over a whole surrogate pair for zero-length matches with the u flag", () => {
    const { matches } = findMatches(compile("", "gu"), "a😀");
    expect(matches.map((match) => match.index)).toEqual([0, 1, 3]);
  });

  it("stops after the first match without the g flag", () => {
    expect(findMatches(compile("a", ""), "aaa").matches).toHaveLength(1);
  });

  it("sets truncated when there are more matches than the limit", () => {
    const result = findMatches(compile("a"), "aaaa", { limit: 3 });
    expect(result.matches).toHaveLength(3);
    expect(result.truncated).toBe(true);
    expect(findMatches(compile("a"), "aaa", { limit: 3 }).truncated).toBe(false);
  });
});

describe("replacePreview", () => {
  it("replaces numbered groups with $1", () => {
    expect(replacePreview(compile("(\\w+)@(\\w+)"), "ada@home bob@work", "$2:$1")).toBe("home:ada work:bob");
  });

  it("replaces named groups with $<name>", () => {
    expect(replacePreview(compile("(?<y>\\d{4})-(?<m>\\d{2})"), "2026-10", "$<m>/$<y>")).toBe("10/2026");
  });

  it("replaces only the first match without the g flag", () => {
    expect(replacePreview(compile("a", ""), "aaa", "b")).toBe("baa");
  });
});
