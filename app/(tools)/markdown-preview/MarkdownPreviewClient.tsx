"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import DOMPurify from "dompurify";
import { CopyButton } from "@/components/shared/CopyButton";
import { getMarkdownStats, insertMarkdown, insertTableMarkdown, renderMarkdown } from "@/lib/markdown-preview";

const starter = `# Hello, Markdown!\n\nWrite on the left and see **GitHub-flavored Markdown** rendered here.\n\n- [x] Live preview\n- [ ] Copy sanitized HTML\n\n| Feature | Status |\n| --- | --- |\n| Tables | Ready |\n| Code | \`const answer = 42\` |\n\n~~~ts\nconst greeting = "Hello, world!";\n~~~`;
const MAX_IMPORT_BYTES = 1024 * 1024;
const IMPORT_ACCEPT = ".md,.markdown,.txt,text/markdown,text/plain";
const subscribeToMountedState = () => () => {};

function sanitizePreviewHtml(markdown: string) {
  const clean = DOMPurify.sanitize(renderMarkdown(markdown), {
    FORBID_TAGS: ["script"],
    FORBID_ATTR: ["onerror", "onload", "onclick"],
  });
  const template = document.createElement("template");
  template.innerHTML = clean;
  template.content.querySelectorAll("script").forEach((element) => element.remove());
  template.content.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on") || ((name === "href" || name === "src") && /^\s*javascript:/i.test(attribute.value))) {
        element.removeAttribute(attribute.name);
      }
    }
  });
  return template.innerHTML;
}

export function MarkdownPreviewClient() {
  const [markdown, setMarkdown] = useState(starter);
  const [importError, setImportError] = useState<string | null>(null);
  const [darkPreview, setDarkPreview] = useState(false);
  const mounted = useSyncExternalStore(subscribeToMountedState, () => true, () => false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const html = useMemo(() => {
    return mounted ? sanitizePreviewHtml(markdown) : "";
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
    setMarkdown(insertTableMarkdown(markdown, input?.selectionStart ?? markdown.length));
    requestAnimationFrame(() => input?.focus());
  }

  async function importFile(file: File) {
    setImportError(null);
    if (file.size > MAX_IMPORT_BYTES) {
      setImportError("The Markdown file is too large. Please choose a file smaller than 1 MiB.");
      return;
    }
    if (markdown !== starter && !window.confirm("Replace the current Markdown document with this file?")) {
      return;
    }
    try {
      const content = await file.text();
      setMarkdown(content);
    } catch {
      setImportError("Could not read that Markdown file. Please try another file.");
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void importFile(file);
  }

  return <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10 space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      {[['Bold','**','**'],['Italic','*','*'],['Code','`','`'],['Link','[','](https://example.com)'],['H2','## ','']].map(([label, before, after]) => <button key={label} type="button" className="btn" onClick={() => insert(before, after)}>{label}</button>)}
      <button type="button" className="btn" onClick={insertImage}>Image</button>
      <button type="button" className="btn" onClick={insertTable}>Table</button>
      <button type="button" className="btn" onClick={() => insert("- [ ] ", "", "task")}>Task</button>
      <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>Open .md file</button>
      <input ref={fileInputRef} type="file" accept={IMPORT_ACCEPT} onChange={handleFileChange} className="hidden" aria-label="Open Markdown file" />
      <button type="button" className="btn ml-auto" onClick={() => setDarkPreview((v) => !v)}>{darkPreview ? "Light preview" : "Dark preview"}</button>
      <CopyButton value={html} label="Copy HTML" successMessage="Sanitized HTML copied" disabled={!markdown} />
      <CopyButton value={markdown} label="Copy Markdown" disabled={!markdown} />
      <button type="button" className="btn" onClick={download} disabled={!markdown}>Download .md</button>
    </div>
    {importError && <p role="alert" className="rounded-md border border-[var(--rose)]/30 bg-[var(--rose)]/5 px-3 py-2 text-[13px] text-[var(--rose)]">{importError}</p>}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="card overflow-hidden"><div className="px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)] font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">Markdown</div><textarea ref={textareaRef} aria-label="Markdown input" value={markdown} onChange={(e) => setMarkdown(e.target.value)} spellCheck={false} className="editor-input p-4" style={{ minHeight: 520 }} /></div>
      <div className="card overflow-hidden" style={{ background: darkPreview ? "#17191f" : "#ffffff", color: darkPreview ? "#f4f4f5" : "#17191f" }}><div className="px-3 py-2 border-b border-black/10 font-mono text-[10.5px] tracking-[0.22em] uppercase opacity-60">Preview</div><article className="markdown-preview p-5 min-h-[520px] overflow-auto" dangerouslySetInnerHTML={{ __html: html }} /></div>
    </div>
    <div className="card px-4 py-3 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] text-[var(--fg-dim)]"><span>{words} words</span><span>{chars} chars</span><span>{lines} lines</span><span>{readingMinutes} min read</span><span className="ml-auto">HTML is sanitized before rendering and export</span></div>
  </section>;
}
