"use client";

import { useMemo, useState } from "react";
import { Download, AlertCircle, Eye, Info as InfoIcon } from "lucide-react";
import {
  base64ToBytes,
  formatBytes,
  getMimeFromMagicBytes,
  toDataUri,
} from "@/lib/base64-utils";
import { downloadBlob } from "@/lib/download";
import { HexDump } from "@/components/shared/HexDump";
import { CopyButton } from "@/components/shared/CopyButton";
import { useToast } from "@/components/shared/Toast";
import { cn } from "@/lib/cn";

export function DecodeTab() {
  const [input, setInput] = useState("");
  const [showHex, setShowHex] = useState(false);
  const { push } = useToast();

  // Auto-strip `data:...;base64,` prefix
  const autoStripped = useMemo(() => {
    const m = input.trim().match(/^data:([^;]+);base64,([\s\S]*)$/);
    if (m) return { prefix: m[1], rest: m[2] };
    return null;
  }, [input]);

  const effectiveInput = autoStripped?.rest ?? input;

  const result = useMemo(() => {
    if (!effectiveInput.trim()) return null;
    const r = base64ToBytes(effectiveInput);
    if (!r.ok) return { ok: false as const, error: r.error };
    const bytes = r.value;
    let mime = getMimeFromMagicBytes(bytes);
    if (autoStripped) {
      mime = mime ?? {
        mime: autoStripped.prefix,
        extension: autoStripped.prefix.split("/")[1]?.split("+")[0] ?? "bin",
        label: `${autoStripped.prefix} (from data URI)`,
        isImage: autoStripped.prefix.startsWith("image/"),
      };
    }
    return {
      ok: true as const,
      bytes,
      mime,
      size: bytes.length,
      dataUri: mime ? toDataUri(bytes, mime.mime) : null,
      asText: (() => {
        if (mime?.mime === "text/plain" || mime?.mime === "application/json" || mime?.mime === "application/xml" || mime?.mime === "text/html") {
          try {
            return new TextDecoder().decode(bytes);
          } catch {
            return null;
          }
        }
        return null;
      })(),
    };
  }, [effectiveInput, autoStripped]);

  function download() {
    if (!result?.ok) return;
    const mime = result.mime?.mime ?? "application/octet-stream";
    const ext = result.mime?.extension ?? "bin";
    downloadBlob(new Uint8Array(result.bytes), `decoded.${ext}`, mime);
    push(`Downloaded decoded.${ext}`, "success");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
          <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
            Base64 input
          </span>
          <span className="font-mono text-[10.5px] text-[var(--fg-dim)]">{input.length} chars</span>
        </div>
        {autoStripped && (
          <div className="px-3 py-2 border-b border-[var(--hairline)] bg-[rgba(0,229,199,0.04)] flex items-center gap-2">
            <InfoIcon className="w-3.5 h-3.5 text-[var(--cyan)]" />
            <span className="font-mono text-[11.5px] text-[var(--fg-muted)]">
              Detected data URI — stripped <span className="text-[var(--cyan)]">data:{autoStripped.prefix};base64,</span>
            </span>
          </div>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder="Paste a base64 string (or a data: URI) to decode..."
          className="editor-input flex-1 p-4"
          style={{ minHeight: 320 }}
        />
      </div>

      <div className="card overflow-hidden flex flex-col min-h-[320px]">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
          <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--cyan)]">
            Decoded result
          </span>
          {result?.ok && (
            <div className="flex items-center gap-2">
              <button
                className={cn("btn", showHex && "bg-white/[0.06] border-[var(--hairline-strong)]")}
                onClick={() => setShowHex((v) => !v)}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Hex</span>
              </button>
              {result.mime && result.bytes.length > 0 && (
                <CopyButton
                  value={Array.from(result.bytes).map((b) => b.toString(16).padStart(2, "0")).join("")}
                  label="Copy hex"
                  className="py-1"
                />
              )}
              <button className="btn" onClick={download}>
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 p-4 overflow-auto">
          {!input.trim() && (
            <div className="text-[var(--fg-muted)] text-[13px]">
              Decoded bytes and file preview will appear here.
            </div>
          )}
          {result && !result.ok && (
            <div className="flex items-start gap-2 text-[var(--rose)] text-[13px]">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{result.error}</span>
            </div>
          )}
          {result?.ok && (
            <div className="space-y-3 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <Info label="Detected type" value={result.mime?.label ?? "Unknown / binary"} />
                <Info label="Size" value={formatBytes(result.size)} />
                <Info label="MIME" value={result.mime?.mime ?? "application/octet-stream"} />
                <Info label="Extension" value={`.${result.mime?.extension ?? "bin"}`} />
              </div>

              {result.mime?.isImage && result.dataUri && (
                <div className="rounded-md border border-[var(--hairline)] bg-black/30 p-3 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.dataUri}
                    alt="decoded"
                    style={{ maxWidth: "100%", maxHeight: 260 }}
                  />
                </div>
              )}

              {result.asText && !showHex && (
                <div>
                  <div className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-1">
                    Text preview
                  </div>
                  <pre className="p-3 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12.5px] leading-[1.65] max-h-56 overflow-auto whitespace-pre-wrap break-all">
                    {result.asText.slice(0, 2000)}
                    {result.asText.length > 2000 && "\n…"}
                  </pre>
                </div>
              )}

              {showHex && (
                <div>
                  <div className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-1">
                    Hex dump
                  </div>
                  <div className="p-3 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] max-h-[300px] overflow-auto">
                    <HexDump bytes={result.bytes} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] px-3 py-2">
      <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
        {label}
      </div>
      <div className="mt-1 font-mono text-[13px] text-[var(--fg)] truncate">{value}</div>
    </div>
  );
}
