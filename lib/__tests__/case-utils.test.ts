import { describe, expect, it } from "vitest";
import { detectWords, splitWords, toCase } from "@/lib/case-utils";

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

describe("detectWords", () => {
  it("preserves casing while splitting identifiers", () => {
    expect(detectWords("XMLHttpRequest")).toEqual([
      { lineNumber: 1, words: ["XML", "Http", "Request"] },
    ]);
    expect(detectWords("user_id")).toEqual([
      { lineNumber: 1, words: ["user", "id"] },
    ]);
    expect(detectWords("HTTP_status_code")).toEqual([
      { lineNumber: 1, words: ["HTTP", "status", "code"] },
    ]);
  });

  it("keeps the existing digit and Unicode boundary rules", () => {
    expect(detectWords("version2Update")).toEqual([
      { lineNumber: 1, words: ["version2", "Update"] },
    ]);
    expect(detectWords("ÄpfelBaum\n\nनमस्ते दुनिया")).toEqual([
      { lineNumber: 1, words: ["Äpfel", "Baum"] },
      { lineNumber: 3, words: ["नमस्ते", "दुनिया"] },
    ]);
  });

  it("ignores repeated separators, whitespace, and empty lines", () => {
    expect(detectWords("  user__id  \n\n  ")).toEqual([
      { lineNumber: 1, words: ["user", "id"] },
    ]);
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

  it("drops punctuation in the identifier styles", () => {
    expect(toCase("Hello, World!", "camel")).toBe("helloWorld");
    expect(toCase("Hello, World!", "pascal")).toBe("HelloWorld");
    expect(toCase("Hello, World!", "snake")).toBe("hello_world");
    expect(toCase("Hello, World!", "constant")).toBe("HELLO_WORLD");
    expect(toCase("Hello, World!", "kebab")).toBe("hello-world");
    expect(toCase("Hello, World!", "dot")).toBe("hello.world");
  });

  it("removes apostrophes without splitting the word", () => {
    expect(toCase("What's up?", "camel")).toBe("whatsUp");
    expect(toCase("What's up?", "kebab")).toBe("whats-up");
  });

  it("keeps letters from other alphabets", () => {
    expect(toCase("Café au lait", "camel")).toBe("caféAuLait");
    expect(toCase("नमस्ते दुनिया", "camel")).toBe("नमस्तेदुनिया");
    expect(toCase("नमस्ते दुनिया", "kebab")).toBe("नमस्ते-दुनिया");
    expect(toCase("Cafe\u0301 au lait", "camel")).toBe("cafe\u0301AuLait");
  });

  it("keeps punctuation in the prose styles", () => {
    expect(toCase("Hello, World!", "title")).toBe("Hello, World!");
    expect(toCase("Hello, World!", "sentence")).toBe("Hello, world!");
    expect(toCase("Hello, World!", "lower")).toBe("hello, world!");
    expect(toCase("Hello, World!", "upper")).toBe("HELLO, WORLD!");
  });

  it("keeps . and / in the prose styles", () => {
    expect(toCase("Hello. World.", "lower")).toBe("hello. world.");
    expect(toCase("Hello. World.", "title")).toBe("Hello. World.");
    expect(toCase("it's 3.5 km away", "lower")).toBe("it's 3.5 km away");
    expect(toCase("Read the docs at example.com/start.", "lower")).toBe("read the docs at example.com/start.");
    expect(toCase("Pick a/b, then stop", "upper")).toBe("PICK A/B, THEN STOP");
  });

  it("still splits _, - and case boundaries in the prose styles", () => {
    expect(toCase("user_id", "title")).toBe("User Id");
    expect(toCase("userId", "title")).toBe("User Id");
    expect(toCase("kebab-case-name", "title")).toBe("Kebab Case Name");
    expect(toCase("user.id", "camel")).toBe("userId");
    expect(toCase("user/id", "snake")).toBe("user_id");
  });
});
