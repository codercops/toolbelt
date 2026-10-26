"use client";

import { useMemo, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import { CopyButton } from "@/components/shared/CopyButton";

const starter = `# Hello, Markdown!\n\nWrite on the left and see **GitHub-flavored Markdown** rendered here.\n\n- [x] Live preview\n- [ ] Copy sanitized HTML\n\n| Feature | Status |\n| --- | --- |\n| Tables | Ready |\n| Code | \`const answer = 42\` |\n\n~~~ts\nconst greeting = "Hello, world!";\n~~~`;

marked.use({
  renderer: {
    code({ text, lang }) {
      const language = (lang || "").toLowerCase();
      const grammar = Prism.languages[language] || Prism.languages.markup;
      const highlighted = language && Prism.languages[language]
        ? Prism.highlight(text, grammar, language)
        : Prism.util.encode(text);
      return `<pre class="language-${language || "text"}"><code>${highlighted}</code></pre>`;
    },
  },
});
marked.setOptions({ gfm: true, breaks: true });

export function MarkdownPreviewClient() {
  const [markdown, setMarkdown] = useState(starter);
  const [darkPreview, setDarkPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const html = useMemo(() => {
    const parsed = marked.parse(markdown) as string;
    // Client components are still pre-rendered by Next.js. DOMPurify needs a
    // browser window, so never call it during the server pass.
    return typeof window === "undefined" ? "" : DOMPurify.sanitize(parsed);
  }, [markdown]);
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const lines = markdown ? markdown.split("\n").length : 0;

  function insert(before: string, after = before, placeholder = "text") {
    const input = textareaRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = markdown.slice(start, end) || placeholder;
    const next = markdown.slice(0, start) + before + selected + after + markdown.slice(end);
    setMarkdown(next);
    requestAnimationFrame(() => { input.focus(); input.setSelectionRange(start + before.length, start + before.length + selected.length); });
  }

  function download() {
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
    const link = document.createElement("a"); link.href = url; link.download = "document.md"; link.click(); URL.revokeObjectURL(url);
  }

  function insertImage() {
    insert("![alt text](", ")", "https://example.com/image.png");
  }

  function insertTable() {
    const input = textareaRef.current;
    const position = input?.selectionStart ?? markdown.length;
    const table = "| Header | Header |\n| --- | --- |\n| Cell | Cell |\n";
    setMarkdown(markdown.slice(0, position) + table + markdown.slice(position));
    requestAnimationFrame(() => input?.focus());
  }

  return <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10 space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      {[['Bold','**','**'],['Italic','*','*'],['Code','`','`'],['Link','[','](https://example.com)'],['H2','## ','']].map(([label, before, after]) => <button key={label} type="button" className="btn" onClick={() => insert(before, after)}>{label}</button>)}
      <button type="button" className="btn" onClick={insertImage}>Image</button>
      <button type="button" className="btn" onClick={insertTable}>Table</button>
      <button type="button" className="btn" onClick={() => insert("- [ ] ", "", "task")}>Task</button>
      <button type="button" className="btn ml-auto" onClick={() => setDarkPreview((v) => !v)}>{darkPreview ? "Light preview" : "Dark preview"}</button>
      <CopyButton value={html} label="Copy HTML" successMessage="Sanitized HTML copied" disabled={!markdown} />
      <CopyButton value={markdown} label="Copy Markdown" disabled={!markdown} />
      <button type="button" className="btn" onClick={download} disabled={!markdown}>Download .md</button>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="card overflow-hidden"><div className="px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)] font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">Markdown</div><textarea ref={textareaRef} aria-label="Markdown input" value={markdown} onChange={(e) => setMarkdown(e.target.value)} spellCheck={false} className="editor-input p-4" style={{ minHeight: 520 }} /></div>
      <div className={`card overflow-hidden ${darkPreview ? "bg-[#17191f] text-[#f4f4f5]" : "bg-white text-[#17191f]"}`}><div className="px-3 py-2 border-b border-black/10 font-mono text-[10.5px] tracking-[0.22em] uppercase opacity-60">Preview</div><article className="markdown-preview p-5 min-h-[520px] overflow-auto" dangerouslySetInnerHTML={{ __html: html }} /></div>
    </div>
    <div className="card px-4 py-3 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] text-[var(--fg-dim)]"><span>{words} words</span><span>{markdown.length} chars</span><span>{lines} lines</span><span>{Math.max(1, Math.ceil(words / 200))} min read</span><span className="ml-auto">HTML is sanitized before rendering and export</span></div>
  </section>;
}
