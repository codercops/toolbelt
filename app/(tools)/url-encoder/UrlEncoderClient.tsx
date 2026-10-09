"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ArrowLeftRight } from "lucide-react";
import { encodeUrl, decodeUrl, parseUrl, type UrlEncodeMode } from "@/lib/url-utils";
import { CopyButton } from "@/components/shared/CopyButton";
import { useRegisterCommands } from "@/components/shared/CommandPalette";

type Direction = "encode" | "decode";

export function UrlEncoderClient() {
  const [direction, setDirection] = useState<Direction>("encode");
  const [mode, setMode] = useState<UrlEncodeMode>("component");
  const [plusAsSpace, setPlusAsSpace] = useState(false);
  const [input, setInput] = useState("");

  // Pure, synchronous conversion — derived from input/settings, no effect needed.
  const { output, error } = useMemo((): { output: string; error: string | null } => {
    if (!input) return { output: "", error: null };
    if (direction === "encode") {
      return { output: encodeUrl(input, mode), error: null };
    }
    const r = decodeUrl(input, { plusAsSpace });
    return r.ok ? { output: r.value, error: null } : { output: "", error: r.error };
  }, [input, direction, mode, plusAsSpace]);

  // When either side looks like an absolute URL, show its breakdown.
  const parsed = useMemo(() => {
    for (const candidate of [input, output]) {
      if (!candidate) continue;
      const r = parseUrl(candidate);
      if (r.ok) return r.value;
    }
    return null;
  }, [input, output]);

  function swap() {
    setDirection((d) => (d === "encode" ? "decode" : "encode"));
    setInput(output);
  }

  useRegisterCommands(
    "url-encoder",
    [
      { id: "url:encode", section: "URL Encoder", title: "Encode tab", run: () => setDirection("encode") },
      { id: "url:decode", section: "URL Encoder", title: "Decode tab", run: () => setDirection("decode") },
      { id: "url:swap", section: "URL Encoder", title: "Swap direction", run: swap },
    ],
    [output]
  );

  return (
    <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="segmented" role="tablist" aria-label="Direction">
          <button data-active={direction === "encode"} onClick={() => setDirection("encode")}>
            Encode
          </button>
          <button data-active={direction === "decode"} onClick={() => setDirection("decode")}>
            Decode
          </button>
        </div>

        {direction === "encode" ? (
          <div className="segmented" aria-label="Encode mode">
            <button data-active={mode === "component"} onClick={() => setMode("component")}>
              Component
            </button>
            <button data-active={mode === "uri"} onClick={() => setMode("uri")}>
              Full URL
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 text-[12.5px] font-mono text-[var(--fg-muted)]">
            <input
              type="checkbox"
              checked={plusAsSpace}
              onChange={(e) => setPlusAsSpace(e.target.checked)}
              className="accent-[var(--cyan)]"
            />
            Treat + as space
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
        <div className="card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
            <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
              {direction === "encode" ? "Text or URL" : "Percent-encoded input"}
            </span>
            <span className="font-mono text-[10.5px] text-[var(--fg-dim)]">{input.length} chars</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label={direction === "encode" ? "Text or URL to encode" : "Percent-encoded text to decode"}
            placeholder={
              direction === "encode"
                ? "Type or paste text or a URL to encode..."
                : "Paste percent-encoded text to decode..."
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
            title="Swap direction"
            aria-label="Swap direction"
          >
            <ArrowLeftRight className="w-4 h-4 text-[var(--fg-muted)] group-hover:text-[var(--cyan)] group-hover:rotate-180 transition-all duration-500" />
          </button>
        </div>

        <div className="card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
            <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--cyan)]">
              {direction === "encode" ? "Encoded output" : "Decoded output"}
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
              className="flex-1 p-4 font-mono text-[13px] leading-[1.7] whitespace-pre-wrap break-all overflow-auto text-[var(--cyan)]"
              style={{ minHeight: 280 }}
            >
              {output}
            </pre>
          ) : (
            <div className="flex-1 p-4 text-[var(--fg-muted)] text-[13px]" style={{ minHeight: 280 }}>
              {direction === "encode" ? "Encoded text will appear here." : "Decoded text will appear here."}
            </div>
          )}
        </div>
      </div>

      {parsed && (
        <div className="card overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)] font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
            URL breakdown
          </div>
          <div className="p-3 space-y-2 font-mono text-[12.5px]">
            <Row label="Protocol" value={parsed.protocol} />
            <Row label="Host" value={parsed.host} />
            {parsed.port && <Row label="Port" value={parsed.port} />}
            <Row label="Path" value={parsed.pathname} />
            {parsed.hash && <Row label="Hash" value={parsed.hash} />}
            {parsed.params.length > 0 && (
              <div className="pt-2 mt-1 border-t border-[var(--hairline)] space-y-1.5">
                {parsed.params.map(([key, value], i) => (
                  <div key={`${key}-${i}`} className="flex items-center justify-between gap-2">
                    <span className="text-[var(--fg-muted)] break-all">
                      {key} = <span className="text-[var(--fg)]">{value}</span>
                    </span>
                    <CopyButton value={value} className="py-0.5 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[var(--fg-dim)]">{label}</span>
      <span className="text-[var(--fg)] break-all">{value}</span>
    </div>
  );
}
