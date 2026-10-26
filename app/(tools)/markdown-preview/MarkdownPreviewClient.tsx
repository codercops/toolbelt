"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { CopyButton } from "@/components/shared/CopyButton";
import { getMarkdownStats, insertMarkdown, renderMarkdown } from "@/lib/markdown-preview";

const starter = `# Hello, Markdown!\n\nWrite on the left and see **GitHub-flavored Markdown** rendered here.\n\n- [x] Live preview\n- [ ] Copy sanitized HTML\n\n| Feature | Status |\n| --- | --- |\n| Tables | Ready |\n| Code | \`const answer = 42\` |\n\n~~~ts\nconst greeting = "Hello, world!";\n~~~`;

export function MarkdownPreviewClient() {
  const [markdown, setMarkdown] = useState(starter);
  const [darkPreview, setDarkPreview] = useState(false);
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => setMounted(true), []);
  const html = useMemo(() => {
    return mounted ? DOMPurify.sanitize(renderMarkdown(markdown)) : "";
  }, [markdown, mounted]);
  const { words, chars, lines, readingMinutes } = getMarkdownStats(markdown);

  function insert(before: string, after = before, placeholder = "text") {
    const input = textareaRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const result = insertMarkdown(markdown, start, end, before, after, placeholder);
    setMarkdown(result.value);
    requestAnimationFrame(() => { input.focus(); input.setSelectionRange(result.selectionStart, result.selectionEnd); });
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
    <div className="card px-4 py-3 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] text-[var(--fg-dim)]"><span>{words} words</span><span>{chars} chars</span><span>{lines} lines</span><span>{readingMinutes} min read</span><span className="ml-auto">HTML is sanitized before rendering and export</span></div>
  </section>;
}
