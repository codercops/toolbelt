import { describe, expect, it } from "vitest";
import { createStandaloneHtml, getMarkdownStats, insertMarkdown, insertTableMarkdown, renderMarkdown } from "@/lib/markdown-preview";

describe("markdown preview", () => {
  it("wraps provided content in a complete light HTML document", () => {
    const document = createStandaloneHtml('<h1>Safe</h1><p>Text</p>', "light", "A <title>");
    expect(document).toContain("<!doctype html>");
    expect(document).toContain('<meta charset="utf-8">');
    expect(document).toContain('name="viewport"');
    expect(document).toContain("<title>A &lt;title&gt;</title>");
    expect(document).toContain('<h1>Safe</h1>');
    expect(document.startsWith('<!doctype html>\n<html lang="en">')).toBe(true);
  });

  it("selects the dark export theme", () => {
    const document = createStandaloneHtml("<p>Dark</p>", "dark");
    expect(document).toContain('<html lang="en" data-theme="dark">');
    expect(document).toContain("color-scheme: dark");
  });

  it("gives dark export tokens readable contrast on the code background", () => {
    const document = createStandaloneHtml("", "dark");
    const luminance = (hex: string) => {
      const channels = hex.match(/\w{2}/g)!.map((channel) => {
        const value = parseInt(channel, 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const background = document.match(/:root\[data-theme="dark"\] \{[^}]*--code-bg: #(\w{6})/)![1];
    for (const token of ["number", "boolean", "property", "tag", "keyword", "string", "punctuation", "comment"]) {
      const rule = document.match(new RegExp(`:root\\[data-theme="dark"\\] \\.token\\.${token}(?:,| )[^{}]*\\{ color: #(\\w{6}); \\}`));
      expect(rule, `dark ${token} override`).not.toBeNull();
      const foreground = luminance(rule![1]);
      const backdrop = luminance(background);
      expect((Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05)).toBeGreaterThanOrEqual(3);
    }
  });

  it("renders GFM and highlights fenced code", () => {
    const html = renderMarkdown("- [x] done\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n```ts\nconst value = 1;\n```");
    expect(html).toContain("type=\"checkbox\"");
    expect(html).toContain("<table>");
    expect(html).toContain("language-ts");
    expect(html).toContain("token");
  });

  it("calculates writing stats", () => expect(getMarkdownStats("one two\nthree")).toEqual({ words: 3, chars: 13, lines: 2, readingMinutes: 1 }));

  it.each([
    ["headings", "# Hello\n## World", 2],
    ["lists", "- one\n- two\n* three\n1. four", 4],
    ["task lists", "- [ ] write\n- [x] ship", 2],
    ["quotes", "> quoted text", 2],
    ["rules", "above\n\n---\n\nbelow", 2],
    ["tables", "| a | b |\n| --- | --- |\n| c | d |", 4],
    ["nested quotes and lists", ">  - 2. [x] done", 1],
    ["prose with numbers and brackets", "I have 3. Pick option [x] now", 7],
  ])("counts only words, not markdown markers, in %s", (_label, markdown, words) => {
    expect(getMarkdownStats(markdown).words).toBe(words);
  });

  it("counts no words in whitespace-only text", () => expect(getMarkdownStats("  \n\t ").words).toBe(0));

  it("inserts formatting around the selection", () => expect(insertMarkdown("hello", 0, 5, "**")).toEqual({ value: "**hello**", selectionStart: 2, selectionEnd: 7 }));
});

describe("insertTableMarkdown", () => {
  const starter = "| Header | Header |\n| --- | --- |\n| Cell | Cell |\n";
  const count = (text: string, part: string) => text.split(part).length - 1;
  const withoutSpace = (text: string) => text.replace(/\s+/g, "");

  it.each([
    ["an empty editor", "", 0, starter],
    ["the end of a line of text", "Intro line", 10, `Intro line\n\n${starter}`],
    ["the middle of a line of text", "Intro line", 5, `Intro\n\n${starter}\n line`],
    ["the start of a line of text after another line", "A\nNext", 2, `A\n\n${starter}\nNext`],
    ["the start of the text", "Next", 0, `${starter}\nNext`],
    ["the end of text that ends with a line break", "Intro\n", 6, `Intro\n\n${starter}`],
    ["the start of a line that already has a blank line above", "Intro line\n\nafter", 12, `Intro line\n\n${starter}\nafter`],
    ["a blank line between two lines of text", "Intro line\n\nafter", 11, `Intro line\n\n${starter}\nafter`],
    ["the end of a line that has more text below it", "Intro line\nNext", 10, `Intro line\n\n${starter}\nNext`],
    ["a text with a blank line above and nothing below", "A\n\n", 3, `A\n\n${starter}`],
    ["a first line that is empty", "\nA", 1, `\n${starter}\nA`],
    ["a line above that only has spaces", "A\n  \nB", 5, `A\n  \n${starter}\nB`],
    // White space only before the cursor: that line is blank, so it is ended and the table starts at the
    // margin. Four spaces or a tab in front of it would make the table a code block.
    ["an empty line the cursor sits on after two spaces", "A\n\n  ", 5, `A\n\n  \n${starter}`],
    ["an empty line the cursor sits on after four spaces", "A\n\n    ", 7, `A\n\n    \n${starter}`],
    ["an empty line the cursor sits on after a tab", "A\n\n\t", 4, `A\n\n\t\n${starter}`],
    ["the middle of the spaces on an empty line", "A\n\n    ", 5, `A\n\n  \n${starter}\n  `],
    ["four spaces right under a line of text", "A\n    ", 6, `A\n    \n${starter}`],
    ["a text that is only a tab", "\t", 1, `\t\n${starter}`],
  ])("in %s", (_name, markdown, position, expected) => {
    expect(insertTableMarkdown(markdown, position)).toBe(expected);
  });

  it("keeps a position outside the text inside it", () => {
    expect(insertTableMarkdown("Intro", 99)).toBe(`Intro\n\n${starter}`);
    expect(insertTableMarkdown("Intro", -5)).toBe(`${starter}\nIntro`);
    expect(insertTableMarkdown("Intro line", -5)).toBe(`${starter}\nIntro line`);
    expect(insertTableMarkdown("Intro line", 500)).toBe(`Intro line\n\n${starter}`);
  });

  it("adds no line breaks when there is already a blank line on both sides", () => {
    expect(insertTableMarkdown("A\n\n\nB", 3)).toBe(`A\n\n${starter}\nB`);
    // A blank line above, the end of the text below: exactly the table, and nothing else.
    expect(insertTableMarkdown("A\n\n", 3)).toBe(`A\n\n${starter}`);
  });

  describe("for every cursor position in documents without a table", () => {
    const documents = [
      "A",
      "A\nB",
      "A\n\n  ",
      "A\n\n    ",
      "A\n\n\t",
      "A\n    \nB",
      "A\n\t\nB",
      "A\n    B",
      "    ",
      "\t",
      "A\n\nB",
      "Intro line\n",
      "\n",
      "\n\nA",
      "A  \nB",
      "text\n\n\nmore text",
      "# Title\nA line under it",
      "- one\n- two\n- three",
      "> quote\n> more",
      "One line only, with some words in it",
    ];
    const cases = documents.flatMap((markdown) => Array.from({ length: markdown.length + 1 }, (_, position) => [markdown, position] as const));

    it.each(cases)("%j at %i makes exactly one table and loses no text", (markdown, position) => {
      const result = insertTableMarkdown(markdown, position);
      expect(count(result, "| Header | Header |")).toBe(1);
      expect(count(renderMarkdown(result), "<table>")).toBe(1);
      expect(renderMarkdown(result)).toContain("<th>Header</th>");
      expect(renderMarkdown(result)).toContain("<td>Cell</td>");
      // Not a character was lost or changed. Only white space was added (a cursor inside a word splits it).
      expect(withoutSpace(result.replace(starter, ""))).toBe(withoutSpace(markdown));
    });

    it.each(cases)("%j at %i keeps the text around the table as text, not as table rows", (markdown, position) => {
      const html = renderMarkdown(insertTableMarkdown(markdown, position));
      const rows = html.match(/<tr>/g)?.length ?? 0;
      // The header row and the one data row of the starter table, and no more.
      expect(rows).toBe(2);
    });

    it.each(cases)("%j at %i adds only the line breaks that are missing", (markdown, position) => {
      const before = markdown.slice(0, position);
      const after = markdown.slice(position);
      const blankAbove = before === "" || /(^|\n)[ \t]*\n$/.test(before);
      const blankBelow = after === "" || after.startsWith("\n");
      if (blankAbove && blankBelow) expect(insertTableMarkdown(markdown, position)).toBe(before + starter + after);
    });
  });

  it("splits a table when it is clicked inside one, since the starter table needs its own blank lines", () => {
    const table = "| a | b |\n| --- | --- |\n| 1 | 2 |";
    const html = renderMarkdown(insertTableMarkdown(table, table.indexOf("| 1")));
    expect(html.match(/<table>/g)).toHaveLength(2);
    expect(html).toContain("<p>| 1 | 2 |</p>");
  });
});
