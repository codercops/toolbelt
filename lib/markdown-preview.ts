import { marked } from "marked";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";

export interface MarkdownStats { words: number; chars: number; lines: number; readingMinutes: number; }

export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown) as string;
}

export function getMarkdownStats(markdown: string): MarkdownStats {
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  return { words, chars: markdown.length, lines: markdown ? markdown.split("\n").length : 0, readingMinutes: Math.max(1, Math.ceil(words / 200)) };
}

export function insertMarkdown(markdown: string, start: number, end: number, before: string, after = before, placeholder = "text") {
  const selected = markdown.slice(start, end) || placeholder;
  return { value: markdown.slice(0, start) + before + selected + after + markdown.slice(end), selectionStart: start + before.length, selectionEnd: start + before.length + selected.length };
}

function safeLanguage(lang: string | undefined) {
  return (lang ?? "").toLowerCase().replace(/[^\w-]/g, "");
}

marked.use({ renderer: { code({ text, lang }) {
  const language = safeLanguage(lang);
  const grammar = language && Prism.languages[language];
  const highlighted = grammar ? Prism.highlight(text, grammar, language) : Prism.util.encode(text);
  return `<pre class="language-${language || "text"}"><code>${highlighted}</code></pre>`;
} } });
marked.setOptions({ gfm: true, breaks: true });
