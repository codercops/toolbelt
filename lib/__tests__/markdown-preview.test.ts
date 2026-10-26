import { describe, expect, it } from "vitest";
import { getMarkdownStats, insertMarkdown, renderMarkdown } from "@/lib/markdown-preview";

describe("markdown preview", () => {
  it("renders GFM and highlights fenced code", () => {
    const html = renderMarkdown("- [x] done\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n```ts\nconst value = 1;\n```");
    expect(html).toContain("type=\"checkbox\"");
    expect(html).toContain("<table>");
    expect(html).toContain("language-ts");
    expect(html).toContain("token");
  });

  it("calculates writing stats", () => expect(getMarkdownStats("one two\nthree")).toEqual({ words: 3, chars: 13, lines: 2, readingMinutes: 1 }));

  it("inserts formatting around the selection", () => expect(insertMarkdown("hello", 0, 5, "**")).toEqual({ value: "**hello**", selectionStart: 2, selectionEnd: 7 }));
});
