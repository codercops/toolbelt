"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, AlertCircle, Info, FileCode, Scissors, Archive } from "lucide-react";
import {
  base64ToBytes,
  bytesToBase64,
  detectBase64,
  formatBytes,
  gunzipBytes,
  gzipBytes,
  splitLines,
  toLanguageLiteral,
  type EncodeOptions,
  type LangTarget,
} from "@/lib/base64-utils";
import { CopyButton } from "@/components/shared/CopyButton";
import { cn } from "@/lib/cn";

type Direction = "encode" | "decode";

type ChunkPreset = "none" | "mime76" | "pem64" | "email";
const CHUNK_SIZES: Record<ChunkPreset, number> = { none: 0, mime76: 76, pem64: 64, email: 76 };

export function TextTab() {
  const [direction, setDirection] = useState<Direction>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [urlSafe, setUrlSafe] = useState(false);
  const [padding, setPadding] = useState(true);
  const [autoDetected, setAutoDetected] = useState(false);
  const [gzip, setGzip] = useState(false);
  const [chunk, setChunk] = useState<ChunkPreset>("none");
  const [lang, setLang] = useState<LangTarget>("javascript");
  const [showLang, setShowLang] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const opts: EncodeOptions = { urlSafe, padding: urlSafe ? false : padding };

  // Debounced live translate
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      if (!input) {
        setOutput("");
        setError(null);
        return;
      }
      if (direction === "encode") {
        try {
          let bytes: Uint8Array = new TextEncoder().encode(input);
          if (gzip) {
            const gz = await gzipBytes(bytes);
            if (gz) bytes = gz;
          }
          const raw = bytesToBase64(bytes, opts);
          setOutput(CHUNK_SIZES[chunk] ? splitLines(raw, CHUNK_SIZES[chunk]) : raw);
          setError(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Encoding failed");
          setOutput("");
        }
      } else {
        const r = base64ToBytes(input);
        if (!r.ok) {
          setError(r.error);
          setOutput("");
          return;
        }
        let bytes: Uint8Array = r.value;
        if (gzip) {
          const decompressed = await gunzipBytes(bytes);
          if (decompressed) bytes = decompressed;
          else {
            setError("Input is not valid gzip data.");
            setOutput("");
            return;
          }
        }
        try {
          const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
          setOutput(text);
          setError(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Decode failed");
          setOutput("");
        }
      }
    }, 260);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, direction, urlSafe, padding, gzip, chunk]);

  // Auto-detect base64 on paste (if direction=encode)
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    if (direction === "encode") {
      const pasted = e.clipboardData.getData("text");
      if (pasted && detectBase64(pasted)) {
        setAutoDetected(true);
        setDirection("decode");
        setTimeout(() => setAutoDetected(false), 4000);
      }
    }
  }

  function swap() {
    setDirection((d) => (d === "encode" ? "decode" : "encode"));
    setInput(output);
    setOutput(input);
  }

  // Ctrl/Cmd+Enter / Cmd+Shift+S / Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      // Don't hijack shortcuts while the command palette (or any dialog) is open.
      if ((e.target as HTMLElement | null)?.closest('[role="dialog"]')) return;
      if (e.key === "Enter") {
        e.preventDefault();
        // Effect debounce will compute; nothing to do synchronously.
      } else if (e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        swap();
      } else if (e.shiftKey && e.key.toLowerCase() === "k") {
        // Cmd/Ctrl+K opens the command palette; clear moves to Cmd/Ctrl+Shift+K.
        e.preventDefault();
        setInput("");
        setOutput("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, input, opts, urlSafe, padding]);

  const inputBytes = useMemo(() => new Blob([input]).size, [input]);
  const outputBytes = useMemo(() => new Blob([output]).size, [output]);
  const deltaPct =
    inputBytes > 0 ? Math.round(((outputBytes - inputBytes) / inputBytes) * 100) : 0;

  return (
    <div className="space-y-4">
      {autoDetected && (
        <div className="animate-slide-down flex items-center gap-2 px-3 py-2 rounded-md border border-[rgba(0,229,199,0.3)] bg-[rgba(0,229,199,0.06)]">
          <Info className="w-4 h-4 text-[var(--cyan)]" />
          <span className="text-[13px] text-[var(--fg)]">
            Looks like base64 — switched to decode mode
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="segmented">
          <button data-active={direction === "encode"} onClick={() => setDirection("encode")}>
            Text → Base64
          </button>
          <button data-active={direction === "decode"} onClick={() => setDirection("decode")}>
            Base64 → Text
          </button>
        </div>
        <div className="segmented" aria-label="Base64 variant">
          <button data-active={!urlSafe} onClick={() => setUrlSafe(false)}>
            Standard
          </button>
          <button data-active={urlSafe} onClick={() => setUrlSafe(true)}>
            URL-safe
          </button>
        </div>
        {!urlSafe && (
          <label className="flex items-center gap-2 text-[12.5px] font-mono text-[var(--fg-muted)]">
            <input
              type="checkbox"
              checked={padding}
              onChange={(e) => setPadding(e.target.checked)}
              className="accent-[var(--cyan)]"
            />
            padding (=)
          </label>
        )}
        <label className="flex items-center gap-2 text-[12.5px] font-mono text-[var(--fg-muted)]">
          <input
            type="checkbox"
            checked={gzip}
            onChange={(e) => setGzip(e.target.checked)}
            className="accent-[var(--cyan)]"
          />
          <Archive className="w-3 h-3" />
          {direction === "encode" ? "Gzip before encode" : "Gunzip after decode"}
        </label>
        <label className="flex items-center gap-2 text-[12.5px] font-mono text-[var(--fg-muted)]">
          <Scissors className="w-3 h-3" />
          Chunk
          <select
            value={chunk}
            onChange={(e) => setChunk(e.target.value as ChunkPreset)}
            className="bg-[var(--bg-raise)] border border-[var(--hairline)] rounded px-2 py-1 text-[12px] font-mono text-[var(--fg)]"
          >
            <option value="none">No split</option>
            <option value="mime76">MIME (76)</option>
            <option value="pem64">PEM (64)</option>
            <option value="email">Email (76)</option>
          </select>
        </label>
      </div>

      {/* Info bar */}
      {(input || output) && (
        <div className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-md border border-[var(--hairline)] bg-[var(--bg-card)] font-mono text-[11.5px] text-[var(--fg-muted)]">
          <span>
            <span className="text-[var(--fg)]">{formatBytes(inputBytes)}</span>
            <span className="text-[var(--fg-dim)]"> input</span>
          </span>
          <span className="text-[var(--fg-dim)]">→</span>
          <span>
            <span className="text-[var(--fg)]">{formatBytes(outputBytes)}</span>
            <span className="text-[var(--fg-dim)]"> output</span>
          </span>
          {inputBytes > 0 && (
            <span
              className={cn(
                "ml-auto",
                deltaPct > 0 ? "text-[var(--amber)]" : "text-[var(--cyan)]"
              )}
            >
              {deltaPct >= 0 ? "+" : ""}
              {deltaPct}%
            </span>
          )}
        </div>
      )}

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
        <div className="card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
            <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
              {direction === "encode" ? "Plain text" : "Base64 input"}
            </span>
            <span className="font-mono text-[10.5px] text-[var(--fg-dim)]">
              {input.length} chars
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            placeholder={
              direction === "encode"
                ? "Type or paste text to encode..."
                : "Paste base64 to decode..."
            }
            spellCheck={false}
            className="editor-input flex-1 p-4"
            style={{ minHeight: 280 }}
          />
        </div>

        <div className="flex lg:flex-col items-center justify-center lg:py-8 gap-2">
          <button
            type="button"
            onClick={swap}
            className="group w-11 h-11 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-raise)] flex items-center justify-center hover:border-[var(--cyan)] hover:shadow-[0_0_30px_-8px_rgba(0,229,199,0.6)] transition-all"
            title="Swap direction (⌘⇧S)"
            aria-label="Swap direction"
          >
            <ArrowLeftRight className="w-4 h-4 text-[var(--fg-muted)] group-hover:text-[var(--cyan)] group-hover:rotate-180 transition-all duration-500" />
          </button>
        </div>

        <div className="card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
            <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--amber)]">
              {direction === "encode" ? "Base64 output" : "Decoded text"}
            </span>
            <CopyButton value={output} disabled={!output} className="py-1" />
          </div>
          {error ? (
            <div className="flex-1 p-4 flex items-start gap-2 text-[13px] text-[var(--rose)]">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : output ? (
            <pre
              className={cn(
                "flex-1 p-4 font-mono text-[13px] leading-[1.7] whitespace-pre-wrap break-all overflow-auto",
                direction === "encode" && "text-[var(--amber)]"
              )}
              style={{ minHeight: 280 }}
            >
              {output}
            </pre>
          ) : (
            <div className="flex-1 p-4 text-[var(--fg-muted)] text-[13px]" style={{ minHeight: 280 }}>
              {direction === "encode" ? "Encoded base64 will appear here." : "Decoded text will appear here."}
            </div>
          )}
        </div>
      </div>

      {output && direction === "encode" && (
        <div className="card overflow-hidden animate-fade-in">
          <button
            type="button"
            onClick={() => setShowLang((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]"
          >
            <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)] flex items-center gap-1.5">
              <FileCode className="w-3 h-3" />
              Copy as code literal {showLang ? "" : "— click to expand"}
            </span>
          </button>
          {showLang && (
            <div className="p-3 space-y-2">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LangTarget)}
                className="bg-[var(--bg-soft)] border border-[var(--hairline)] rounded px-2 py-1 text-[12.5px] font-mono text-[var(--fg)]"
              >
                {(["javascript", "typescript", "python", "go", "rust", "java", "shell", "sql"] as LangTarget[]).map(
                  (l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  )
                )}
              </select>
              <div className="flex items-center justify-between gap-2">
                <pre className="flex-1 p-2.5 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12px] text-[var(--amber)] whitespace-pre-wrap break-all max-h-32 overflow-auto">
                  {toLanguageLiteral(output, lang)}
                </pre>
                <CopyButton value={toLanguageLiteral(output, lang)} className="py-1 shrink-0" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state use cases */}
      {!input && (
        <div>
          <div className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-2 mt-4">
            Common uses
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <UseCase title="HTTP Basic Auth" sub="user:pass → base64" />
            <UseCase title="JWT claims" sub="Decode the payload" />
            <UseCase title="Data URIs" sub="Embed images in HTML" />
            <UseCase title="API payloads" sub="Binary data in JSON" />
          </div>
        </div>
      )}
    </div>
  );
}

function UseCase({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="card p-3">
      <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--sky)]">
        {title}
      </div>
      <div className="mt-1 text-[12.5px] text-[var(--fg-muted)]">{sub}</div>
    </div>
  );
}
