"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/shared/CopyButton";
import {
  bytesToAscii85,
  bytesToBase32,
  bytesToBase58,
  bytesToHex,
  bytesToHexSpaced,
  computeHashes,
  formatBytes,
} from "@/lib/base64-utils";
import { cn } from "@/lib/cn";
import { useEffect } from "react";

type Encoding = "hex" | "hex-spaced" | "base32" | "base58" | "ascii85";

const LABELS: Record<Encoding, string> = {
  hex: "Hex (packed)",
  "hex-spaced": "Hex (spaced)",
  base32: "Base32 (RFC 4648)",
  base58: "Base58 (Bitcoin)",
  ascii85: "Ascii85 (Adobe)",
};

export function EncodingsTab() {
  const [text, setText] = useState("");
  const [hashes, setHashes] = useState<Record<string, string> | null>(null);

  const bytes = useMemo(() => new TextEncoder().encode(text), [text]);

  const outputs = useMemo(() => {
    return {
      hex: bytesToHex(bytes),
      "hex-spaced": bytesToHexSpaced(bytes),
      base32: bytesToBase32(bytes),
      base58: bytesToBase58(bytes),
      ascii85: bytesToAscii85(bytes),
    } as Record<Encoding, string>;
  }, [bytes]);

  useEffect(() => {
    let cancelled = false;
    if (bytes.length === 0) {
      setHashes(null);
      return;
    }
    computeHashes(bytes).then((h) => {
      if (!cancelled) setHashes(h);
    });
    return () => {
      cancelled = true;
    };
  }, [bytes]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
          <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
            Plain text
          </span>
          <span className="font-mono text-[10.5px] text-[var(--fg-dim)]">
            {formatBytes(bytes.length)}
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder="Type or paste text to see it in multiple encodings..."
          className="editor-input flex-1 p-4"
          style={{ minHeight: 260 }}
        />
      </div>

      <div className="space-y-3">
        {(Object.keys(LABELS) as Encoding[]).map((enc) => (
          <div key={enc} className="card overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
              <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                {LABELS[enc]}
              </span>
              <CopyButton value={outputs[enc]} disabled={!text} className="py-1" />
            </div>
            <pre
              className={cn(
                "px-3 py-2 font-mono text-[12.5px] leading-[1.6] whitespace-pre-wrap break-all max-h-32 overflow-auto",
                enc === "hex" || enc === "hex-spaced" ? "text-[var(--amber)]" : "text-[var(--fg)]"
              )}
            >
              {text ? outputs[enc] : <span className="text-[var(--fg-dim)]">—</span>}
            </pre>
          </div>
        ))}

        {hashes && (
          <div className="card overflow-hidden">
            <div className="px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
              <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--cyan)]">
                Hashes
              </span>
            </div>
            <div className="divide-y divide-[var(--hairline)]">
              {(["md5", "sha1", "sha256", "sha384", "sha512"] as const).map((h) => (
                <div key={h} className="flex items-center gap-3 px-3 py-2">
                  <span className="font-mono text-[10.5px] uppercase text-[var(--fg-dim)] w-14 shrink-0">
                    {h}
                  </span>
                  <code className="flex-1 font-mono text-[11.5px] text-[var(--fg)] truncate">
                    {hashes[h]}
                  </code>
                  <CopyButton value={hashes[h]} iconOnly className="!py-1 !px-2" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
