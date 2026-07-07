"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileJson, Globe, Loader2, Lightbulb } from "lucide-react";
import { Toolbar } from "./components/Toolbar";
import { OutputPanel } from "./components/OutputPanel";
import { ConversionPanel } from "./components/ConversionPanel";
import { FindBar } from "./components/FindBar";
import { DiffPanel } from "./components/DiffPanel";
import { StatsBar } from "./components/StatsBar";
import {
  format,
  minify,
  parseJson5Compat,
  SAMPLE_JSON,
  sortKeys,
  validate,
  type JsonError,
} from "@/lib/json-utils";
import { useToast } from "@/components/shared/Toast";
import { useTheme } from "@/components/shared/ThemeProvider";
import { HistoryPanel, useHistory } from "@/components/shared/HistoryPanel";
import { useRegisterCommands } from "@/components/shared/CommandPalette";
import { downloadBlob } from "@/lib/download";
import { cn } from "@/lib/cn";

export function JsonFormatterClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState<2 | 4>(2);
  const [error, setError] = useState<JsonError | null>(null);
  const [successPulse, setSuccessPulse] = useState(false);
  const { theme } = useTheme();
  const [urlDialog, setUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorShake, setErrorShake] = useState(0);
  const [diffOpen, setDiffOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [json5, setJson5] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { push } = useToast();
  const history = useHistory("json-formatter", 15);

  const lineCount = input ? input.split("\n").length : 0;

  const doFormat = useCallback(
    (silent = false) => {
      if (!input.trim()) {
        setOutput("");
        setError(null);
        return;
      }
      const r = json5 ? parseJson5Compat(input, indent) : format(input, indent);
      if (r.ok) {
        setOutput(r.value);
        setError(null);
        setSuccessPulse(true);
        setTimeout(() => setSuccessPulse(false), 500);
        if (!silent) {
          push("Formatted ✓", "success");
          history.push(input);
        }
      } else {
        setError(r.error);
        setErrorShake((n) => n + 1);
        if (!silent) push("Invalid JSON", "error");
      }
    },
    [input, indent, json5, push, history]
  );

  const doMinify = useCallback(() => {
    const r = minify(input);
    if (r.ok) {
      setOutput(r.value);
      setError(null);
      push("Minified ✓", "success");
      history.push(input);
    } else {
      setError(r.error);
      setErrorShake((n) => n + 1);
      push("Invalid JSON", "error");
    }
  }, [input, push, history]);

  const doValidate = useCallback(() => {
    const r = validate(input);
    if (r.ok) {
      setError(null);
      push("Valid JSON ✓", "success");
    } else {
      setError(r.error);
      setErrorShake((n) => n + 1);
      push("Invalid JSON", "error");
    }
  }, [input, push]);

  const doSort = useCallback(() => {
    const r = sortKeys(input, indent);
    if (r.ok) {
      setOutput(r.value);
      setInput(r.value);
      setError(null);
      push("Sorted keys ✓", "success");
    } else {
      setError(r.error);
      setErrorShake((n) => n + 1);
      push("Invalid JSON", "error");
    }
  }, [input, indent, push]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
    push("Cleared", "info");
    inputRef.current?.focus();
  }, [push]);

  const handleDownload = useCallback(() => {
    const data = output || input;
    if (!data) {
      push("Nothing to download", "error");
      return;
    }
    downloadBlob(data, "data.json", "application/json");
    push("Downloaded data.json", "success");
  }, [output, input, push]);

  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE_JSON);
    setError(null);
    setTimeout(() => {
      const r = format(SAMPLE_JSON, indent);
      if (r.ok) setOutput(r.value);
    }, 0);
  }, [indent]);

  const handleFetchUrl = useCallback(async () => {
    if (!urlInput.trim()) return;
    setUrlLoading(true);
    setUrlError(null);
    try {
      const res = await fetch(urlInput.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      JSON.parse(text);
      setInput(text);
      setUrlDialog(false);
      setUrlInput("");
      push("Fetched and loaded", "success");
      setTimeout(() => {
        const r = format(text, indent);
        if (r.ok) setOutput(r.value);
      }, 0);
    } catch (e) {
      setUrlError(
        e instanceof TypeError
          ? "Could not reach URL (CORS or network). Try a JSON endpoint that allows cross-origin."
          : e instanceof Error
          ? e.message
          : "Fetch failed"
      );
    } finally {
      setUrlLoading(false);
    }
  }, [urlInput, indent, push]);

  // Drag & drop .json
  useEffect(() => {
    function onDragOver(e: DragEvent) {
      e.preventDefault();
      if (e.dataTransfer?.types.includes("Files")) setIsDragging(true);
    }
    function onDragLeave(e: DragEvent) {
      if (e.relatedTarget === null) setIsDragging(false);
    }
    async function onDrop(e: DragEvent) {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      const text = await file.text();
      setInput(text);
      push(`Loaded ${file.name}`, "success");
      const r = format(text, indent);
      if (r.ok) {
        setOutput(r.value);
        setError(null);
      } else {
        setError(r.error);
      }
    }
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [indent, push]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      // Don't hijack shortcuts while the command palette (or any dialog) is open.
      if ((e.target as HTMLElement | null)?.closest('[role="dialog"]')) return;
      const k = e.key.toLowerCase();
      if (e.key === "Enter") {
        e.preventDefault();
        doFormat();
      } else if (k === "m" && !e.shiftKey) {
        e.preventDefault();
        doMinify();
      } else if (k === "k" && e.shiftKey) {
        // Cmd/Ctrl+K opens the command palette; clear moves to Cmd/Ctrl+Shift+K.
        e.preventDefault();
        handleClear();
      } else if (k === "d") {
        e.preventDefault();
        handleDownload();
      } else if (k === "f") {
        e.preventDefault();
        setFindOpen(true);
      } else if (k === "s" && e.shiftKey) {
        e.preventDefault();
        doSort();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doFormat, doMinify, doSort, handleClear, handleDownload]);

  // Register commands
  useRegisterCommands(
    "json-formatter",
    [
      { id: "json:format", section: "JSON Formatter", title: "Format", run: () => doFormat(), shortcut: ["⌘", "↵"] },
      { id: "json:minify", section: "JSON Formatter", title: "Minify", run: doMinify, shortcut: ["⌘", "M"] },
      { id: "json:validate", section: "JSON Formatter", title: "Validate", run: doValidate },
      { id: "json:sort", section: "JSON Formatter", title: "Sort keys alphabetically", run: doSort, shortcut: ["⌘", "⇧", "S"] },
      { id: "json:diff", section: "JSON Formatter", title: diffOpen ? "Close diff panel" : "Open diff panel", run: () => setDiffOpen((v) => !v) },
      { id: "json:stats", section: "JSON Formatter", title: statsOpen ? "Hide stats" : "Show stats", run: () => setStatsOpen((v) => !v) },
      { id: "json:find", section: "JSON Formatter", title: "Find in input", run: () => setFindOpen(true), shortcut: ["⌘", "F"] },
      { id: "json:fetch", section: "JSON Formatter", title: "Fetch from URL", run: () => setUrlDialog(true) },
      { id: "json:sample", section: "JSON Formatter", title: "Load example", run: handleLoadSample },
      { id: "json:download", section: "JSON Formatter", title: "Download as .json", run: handleDownload, shortcut: ["⌘", "D"] },
      { id: "json:clear", section: "JSON Formatter", title: "Clear all", run: handleClear, shortcut: ["⌘", "K"] },
    ],
    [doFormat, doMinify, doValidate, doSort, diffOpen, statsOpen, handleDownload, handleLoadSample, handleClear]
  );

  // Scroll to find match
  const findScrollTo = useCallback((pos: number) => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(pos, pos + 0);
    // Compute approximate scroll: lines up to pos
    const before = input.slice(0, pos).split("\n").length;
    const lineHeight = 21.45;
    el.scrollTop = Math.max(0, (before - 4) * lineHeight);
  }, [input]);

  return (
    <>
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-4">
        <Toolbar
          indent={indent}
          onIndentChange={setIndent}
          onFormat={() => doFormat()}
          onMinify={doMinify}
          onValidate={doValidate}
          onClear={handleClear}
          onDownload={handleDownload}
          onLoadSample={handleLoadSample}
          onSort={doSort}
          onToggleDiff={() => setDiffOpen((v) => !v)}
          diffOpen={diffOpen}
          onToggleStats={() => setStatsOpen((v) => !v)}
          statsOpen={statsOpen}
          onFind={() => setFindOpen(true)}
          output={output}
          json5={json5}
          onJson5Toggle={setJson5}
        />
      </section>

      {error && (
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-4">
          <div
            key={errorShake}
            className="err-shake animate-fade-in rounded-lg border border-[rgba(255,77,109,0.3)] bg-[rgba(255,77,109,0.06)] px-4 py-3 flex items-start gap-3"
          >
            <AlertCircle className="w-4 h-4 text-[var(--rose)] mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--rose)]">
                  Invalid JSON
                </span>
                <span className="font-mono text-[12px] text-[var(--fg-muted)]">
                  line {error.line}, column {error.column}
                </span>
              </div>
              <p className="mt-1 text-[14px] text-[var(--fg)]">{error.message}</p>
              {error.suggestion && (
                <p className="mt-2 flex items-start gap-1.5 text-[13px] text-[var(--amber)]">
                  <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    <span className="font-medium">Did you mean:</span> {error.suggestion}
                  </span>
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {!error && output && (
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-4">
          <div className={cn("animate-fade-in inline-flex items-center gap-2", successPulse && "animate-pulse-glow")}>
            <span className="badge badge-ok">
              <CheckCircle2 className="w-3 h-3" />
              Valid
            </span>
            <span className="font-mono text-[11px] text-[var(--fg-dim)]">
              {output.length} chars · {output.split("\n").length} lines
            </span>
          </div>
        </section>
      )}

      {statsOpen && (input.trim().length > 0) && (
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-4">
          <StatsBar input={input} output={output} />
        </section>
      )}

      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col min-h-[420px]">
            <div
              className={cn(
                "relative flex-1 flex flex-col rounded-lg overflow-hidden border transition-all duration-200",
                error ? "err-border border-[var(--hairline)]" : "border-[var(--hairline)]",
                "bg-[var(--bg-soft)]",
                isDragging && "border-[var(--cyan)] shadow-[0_0_40px_-10px_rgba(0,229,199,0.4)]"
              )}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-card)]">
                <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)] flex items-center gap-2">
                  <FileJson className="w-3 h-3" />
                  Input · {lineCount} lines · {input.length} chars
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost text-[12px]"
                    onClick={() => setUrlDialog(true)}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Fetch from URL</span>
                  </button>
                </div>
              </div>
              {findOpen && (
                <FindBar
                  text={input}
                  onClose={() => setFindOpen(false)}
                  onScrollTo={findScrollTo}
                />
              )}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={`Paste JSON here...\n\nTip: drop a .json file anywhere on the page, or paste a URL.`}
                className="editor-input flex-1 px-4 py-3 bg-transparent"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                style={{ minHeight: 400 }}
              />
            </div>
          </div>

          <OutputPanel output={output} theme={theme} />
        </div>

        {diffOpen && (
          <div className="mt-4 animate-fade-in">
            <DiffPanel leftInput={input} />
          </div>
        )}

        <ConversionPanel input={input} />

        <div className="mt-4">
          <HistoryPanel
            storageKey="json-formatter"
            onSelect={(v) => {
              setInput(v);
              const r = format(v, indent);
              if (r.ok) {
                setOutput(r.value);
                setError(null);
              }
            }}
            formatLabel={(item) => {
              const firstLine = item.value.replace(/\s+/g, " ").slice(0, 80);
              return firstLine;
            }}
          />
        </div>
      </section>

      {urlDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setUrlDialog(false)}
        >
          <div
            className="card-raise w-full max-w-md p-5 animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold text-[var(--fg)]">
              Fetch JSON from URL
            </h3>
            <p className="mt-1 text-[13px] text-[var(--fg-muted)]">
              The URL must return JSON and allow CORS.
            </p>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
              autoFocus
              placeholder="https://jsonplaceholder.typicode.com/todos/1"
              className="mt-4 w-full font-mono text-[13px] px-3 py-2 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] text-[var(--fg)] focus:border-[var(--cyan)] outline-none"
            />
            {urlError && (
              <p className="mt-2 text-[12.5px] text-[var(--rose)]">{urlError}</p>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button className="btn" onClick={() => setUrlDialog(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleFetchUrl}
                disabled={urlLoading}
              >
                {urlLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>Fetch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDragging && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center bg-[rgba(0,229,199,0.08)] backdrop-blur-sm">
          <div className="card-raise px-6 py-4 animate-slide-down text-center">
            <FileJson className="w-8 h-8 mx-auto text-[var(--cyan)] mb-1" />
            <p className="text-[var(--fg)] text-[14px]">Drop your .json file to load</p>
          </div>
        </div>
      )}
    </>
  );
}
