import { marked } from "marked";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";

export interface MarkdownStats { words: number; chars: number; lines: number; readingMinutes: number; }

export type MarkdownExportTheme = "light" | "dark";

const EXPORT_STYLES = `
:root { color-scheme: light; --bg: #fff; --fg: #17191f; --muted: #5f6368; --border: #d9dde3; --code-bg: #f3f4f6; }
:root[data-theme="dark"] { color-scheme: dark; --bg: #17191f; --fg: #f4f4f5; --muted: #b4b8c0; --border: #3b404a; --code-bg: #22252d; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.65 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
main { max-width: 860px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin: 1.5em 0 .6em; }
h1 { font-size: 2.25rem; } h2 { font-size: 1.75rem; } h3 { font-size: 1.4rem; }
p, ul, ol, table, blockquote, pre { margin: 1em 0; }
table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid var(--border); padding: .5rem .7rem; text-align: left; }
blockquote { border-left: 4px solid var(--border); color: var(--muted); margin-left: 0; padding-left: 1rem; }
pre, code { background: var(--code-bg); border-radius: .35rem; } code { padding: .15em .3em; } pre { overflow-x: auto; padding: 1rem; } pre code { padding: 0; }
img { max-width: 100%; height: auto; } a { color: inherit; } input[type="checkbox"] { margin-right: .4rem; }
/* Prism token colors remain local to the exported document. */
.token.comment, .token.prolog, .token.doctype, .token.cdata { color: #708090; }
.token.punctuation { color: #999; } .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol { color: #905; }
.token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #690; }
.token.operator, .token.entity, .token.url, .language-css .token.string { color: #9a6e3a; }
.token.atrule, .token.attr-value, .token.keyword { color: #07a; }
.token.function, .token.class-name { color: #DD4A68; } .token.regex, .token.important, .token.variable { color: #e90; }
/* Dark exports use colors from the in-app preview palette. */
:root[data-theme="dark"] .token.comment, :root[data-theme="dark"] .token.prolog, :root[data-theme="dark"] .token.doctype, :root[data-theme="dark"] .token.cdata { color: #7f8c98; }
:root[data-theme="dark"] .token.keyword, :root[data-theme="dark"] .token.boolean, :root[data-theme="dark"] .token.atrule { color: #9b72ff; }
:root[data-theme="dark"] .token.string, :root[data-theme="dark"] .token.char, :root[data-theme="dark"] .token.attr-value, :root[data-theme="dark"] .token.selector, :root[data-theme="dark"] .token.attr-name, :root[data-theme="dark"] .token.builtin, :root[data-theme="dark"] .token.inserted { color: #159570; }
:root[data-theme="dark"] .token.number, :root[data-theme="dark"] .token.function, :root[data-theme="dark"] .token.property, :root[data-theme="dark"] .token.tag, :root[data-theme="dark"] .token.constant, :root[data-theme="dark"] .token.symbol, :root[data-theme="dark"] .token.class-name { color: #b86b00; }
:root[data-theme="dark"] .token.operator, :root[data-theme="dark"] .token.punctuation, :root[data-theme="dark"] .token.entity, :root[data-theme="dark"] .token.url { color: #7f8c98; }
:root[data-theme="dark"] .token.regex, :root[data-theme="dark"] .token.important, :root[data-theme="dark"] .token.variable { color: #e90; }
`;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export function createStandaloneHtml(content: string, theme: MarkdownExportTheme, title = "Markdown Preview") {
  const themeAttribute = theme === "dark" ? ' data-theme="dark"' : "";
  return `<!doctype html>\n<html lang="en"${themeAttribute}>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${escapeHtml(title)}</title>\n<style>${EXPORT_STYLES}</style>\n</head>\n<body>\n<main>${content}</main>\n</body>\n</html>\n`;
}

export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown) as string;
}

// List numbers and task boxes at the start of a line, which have digits or letters but aren't words.
const LINE_MARKERS = /^[ \t]*(?:[>*+-][ \t]+)*(?:\d+[.)][ \t]+)?(?:\[[ xX]\][ \t]+)?/gm;

export function getMarkdownStats(markdown: string): MarkdownStats {
  const words = markdown.replace(LINE_MARKERS, "").split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
  return { words, chars: markdown.length, lines: markdown ? markdown.split("\n").length : 0, readingMinutes: Math.max(1, Math.ceil(words / 200)) };
}

export function insertMarkdown(markdown: string, start: number, end: number, before: string, after = before, placeholder = "text") {
  const selected = markdown.slice(start, end) || placeholder;
  return { value: markdown.slice(0, start) + before + selected + after + markdown.slice(end), selectionStart: start + before.length, selectionEnd: start + before.length + selected.length };
}

const STARTER_TABLE = "| Header | Header |\n| --- | --- |\n| Cell | Cell |\n";

/**
 * Puts the starter table at `position`, adding only the line breaks that are missing. A table needs a
 * blank line before it, or its header row is glued to the text above, and a blank line after it, or the
 * next line of text becomes another row of the table. In an empty editor the table goes in as it is.
 */
export function insertTableMarkdown(markdown: string, position: number): string {
  const at = Math.min(Math.max(position, 0), markdown.length);
  const before = markdown.slice(0, at);
  const after = markdown.slice(at);

  const lineStart = before.lastIndexOf("\n") + 1;
  const linePrefix = before.slice(lineStart);
  let lead = "";
  if (linePrefix.trim() !== "") {
    // Text comes before the cursor on this line: end the line and leave a blank one.
    lead = "\n\n";
  } else if (linePrefix !== "") {
    // Only white space comes before the cursor. That line is already blank, so end it: the table then
    // starts at the left margin, where four spaces or a tab would have made it a code block.
    lead = "\n";
  } else if (lineStart > 0 && !/(^|\n)[ \t]*\n$/.test(before.slice(0, lineStart))) {
    // The cursor is at the start of a line, and the line above it has text.
    lead = "\n";
  }
  // The table ends with a line break. Text right after it needs a blank line; a line break already there is one.
  const trail = after !== "" && !after.startsWith("\n") ? "\n" : "";

  return before + lead + STARTER_TABLE + trail + after;
}

function safeLanguage(lang: string | undefined) {
  return (lang ?? "").split(/[ \t]/)[0].toLowerCase().replace(/[^\w-]/g, "");
}

marked.use({ renderer: { code({ text, lang }) {
  const language = safeLanguage(lang);
  const grammar = language && Prism.languages[language];
  const highlighted = grammar ? Prism.highlight(text, grammar, language) : Prism.util.encode(text);
  return `<pre class="language-${language || "text"}"><code>${highlighted}</code></pre>`;
} } });
marked.setOptions({ gfm: true, breaks: true });
