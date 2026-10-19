import { describe, expect, it } from "vitest";
import { splitWords, toCase } from "@/lib/case-utils";

describe("splitWords", () => {
  it("splits camelCase and PascalCase boundaries", () => {
    expect(splitWords("userId")).toEqual(["user", "id"]);
    expect(splitWords("UserId")).toEqual(["user", "id"]);
  });

  it("keeps acronyms as one word", () => {
    expect(splitWords("XMLHttpRequest")).toEqual(["xml", "http", "request"]);
  });

  it("treats separators as word breaks", () => {
    expect(splitWords("user_id")).toEqual(["user", "id"]);
    expect(splitWords("user-id")).toEqual(["user", "id"]);
    expect(splitWords("user.id")).toEqual(["user", "id"]);
    expect(splitWords("user/id")).toEqual(["user", "id"]);
  });

  it("keeps digits attached to their word", () => {
    expect(splitWords("version2Update")).toEqual(["version2", "update"]);
  });

  it("handles non-ASCII letters", () => {
    expect(splitWords("ÄpfelBaum")).toEqual(["äpfel", "baum"]);
  });

  it("returns [] for empty input", () => {
    expect(splitWords("")).toEqual([]);
  });
});

describe("toCase", () => {
  it("converts XMLHttpRequest to snake_case", () => {
    expect(toCase("XMLHttpRequest", "snake")).toBe("xml_http_request");
  });

  it("converts user_id to camelCase", () => {
    expect(toCase("user_id", "camel")).toBe("userId");
  });

  it("trims and collapses whitespace for kebab-case", () => {
    expect(toCase("  Hello   World ", "kebab")).toBe("hello-world");
  });

  it("handles non-ASCII input", () => {
    expect(toCase("ÄpfelBaum", "snake")).toBe("äpfel_baum");
    expect(toCase("ÄpfelBaum", "title")).toBe("Äpfel Baum");
  });

  it("returns empty string for empty input", () => {
    expect(toCase("", "camel")).toBe("");
    expect(toCase("   ", "snake")).toBe("");
  });

  it("converts multi-line input line by line", () => {
    expect(toCase("userId\nXMLHttpRequest", "snake")).toBe("user_id\nxml_http_request");
    expect(toCase("hello\n\nworld", "upper")).toBe("HELLO\n\nWORLD");
  });

  it("covers every style", () => {
    expect(toCase("hello world", "pascal")).toBe("HelloWorld");
    expect(toCase("hello world", "constant")).toBe("HELLO_WORLD");
    expect(toCase("hello world", "dot")).toBe("hello.world");
    expect(toCase("hello world", "sentence")).toBe("Hello world");
    expect(toCase("hello world", "lower")).toBe("hello world");
  });
});
