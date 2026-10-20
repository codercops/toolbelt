"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import type { FindMatch } from "./find-selection";

export function FindHighlight({ editorRef, text, match }: {
  editorRef: RefObject<HTMLTextAreaElement | null>;
  text: string;
  match: FindMatch | null;
}) {
  const highlightRef = useRef<HTMLPreElement>(null);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    const highlight = highlightRef.current;
    if (!editor || !highlight) return;
    const sync = () => {
      // clientWidth excludes the scrollbar, keeping wrapped lines aligned.
      highlight.style.width = `${editor.clientWidth}px`;
      highlight.style.height = `${editor.clientHeight}px`;
      highlight.scrollTop = editor.scrollTop;
      highlight.scrollLeft = editor.scrollLeft;
    };
    sync();
    editor.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(editor);
    return () => {
      editor.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [editorRef, text]);

  return (
    <pre
      ref={highlightRef}
      aria-hidden="true"
      className="editor-input pointer-events-none absolute left-0 top-0 overflow-hidden whitespace-pre-wrap break-words px-4 py-3"
      style={{ color: "transparent" }}
    >
      {match ? <>
        {text.slice(0, match.start)}
        <mark style={{ color: "inherit", backgroundColor: "color-mix(in srgb, var(--cyan) 25%, transparent)" }}>
          {text.slice(match.start, match.end)}
        </mark>
        {text.slice(match.end)}
      </> : text}
      {"\n"}
    </pre>
  );
}
