"use client";

import { useRef, useState } from "react";
import { Upload, Download, File as FileIcon, Layers } from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";
import { bytesToBase64, formatBytes, splitLines } from "@/lib/base64-utils";
import { downloadBlob } from "@/lib/download";
import { useToast } from "@/components/shared/Toast";
import { cn } from "@/lib/cn";

interface FileInfo {
  name: string;
  mime: string;
  size: number;
  base64: string;
}

export function FileTab() {
  const [info, setInfo] = useState<FileInfo | null>(null);
  const [chunked, setChunked] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [batch, setBatch] = useState<FileInfo[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const batchRef = useRef<HTMLInputElement>(null);
  const { push } = useToast();

  async function handleFile(file: File) {
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const b64 = bytesToBase64(buf, { urlSafe: false, padding: true });
      setInfo({
        name: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
        base64: b64,
      });
      setBatch(null);
      push(`Encoded ${file.name}`, "success");
    } catch {
      push(`Could not read ${file.name}`, "error");
    }
  }

  async function handleBatch(files: FileList) {
    const arr: FileInfo[] = [];
    let failed = 0;
    for (const file of Array.from(files)) {
      try {
        const buf = new Uint8Array(await file.arrayBuffer());
        arr.push({
          name: file.name,
          mime: file.type || "application/octet-stream",
          size: file.size,
          base64: bytesToBase64(buf, { urlSafe: false, padding: true }),
        });
      } catch {
        failed++;
      }
    }
    setBatch(arr);
    setInfo(null);
    if (arr.length) push(`Encoded ${arr.length} file${arr.length === 1 ? "" : "s"}`, "success");
    if (failed) push(`Could not read ${failed} file${failed === 1 ? "" : "s"}`, "error");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    if (files.length === 1) handleFile(files[0]);
    else handleBatch(files);
  }

  function downloadB64() {
    if (!info) return;
    const content = chunked ? splitLines(info.base64) : info.base64;
    downloadBlob(content, `${info.name}.b64`, "text/plain");
    push("Downloaded .b64", "success");
  }

  const displayed = info ? (chunked ? splitLines(info.base64) : info.base64) : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
      <div className="space-y-3">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "cursor-pointer rounded-lg border border-dashed transition-all p-6 text-center",
            dragging
              ? "border-[var(--cyan)] bg-[rgba(0,229,199,0.05)]"
              : "border-[var(--hairline-strong)] bg-[var(--bg-soft)] hover:border-[var(--hairline-strong)]"
          )}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <input
            ref={batchRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length) handleBatch(e.target.files);
            }}
          />
          {info ? (
            <div className="animate-fade-in">
              <FileIcon className="w-8 h-8 mx-auto text-[var(--cyan)] mb-2" />
              <div className="font-mono text-[13px] text-[var(--fg)] break-all">{info.name}</div>
              <div className="font-mono text-[11px] text-[var(--fg-muted)] mt-1">
                {info.mime} · {formatBytes(info.size)}
              </div>
              <button
                className="btn mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  setInfo(null);
                }}
              >
                Replace file
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-6 h-6 mx-auto text-[var(--fg-dim)] mb-2" />
              <div className="text-[14px] text-[var(--fg)]">Drop any file here</div>
              <div className="mt-1 text-[12px] text-[var(--fg-muted)]">
                or click to browse · drop multiple for batch mode
              </div>
            </div>
          )}
        </div>

        <button
          className="btn w-full justify-center"
          onClick={(e) => {
            e.stopPropagation();
            batchRef.current?.click();
          }}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Batch encode multiple files</span>
        </button>

        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-2">
            Common uses
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["Binary in JSON", "Email attachments", "API data transfer", "CLI clipboard"].map((u) => (
              <span
                key={u}
                className="font-mono text-[10.5px] tracking-wide px-2 py-1 rounded-md border border-[var(--hairline)] text-[var(--fg-muted)] bg-white/[0.015]"
              >
                {u}
              </span>
            ))}
          </div>
        </div>
      </div>

      {info ? (
        <div className="card overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
            <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--amber)]">
              Base64 · {formatBytes(new Blob([displayed]).size)}
            </span>
            <div className="flex items-center gap-2">
              <div className="segmented">
                <button data-active={chunked} onClick={() => setChunked(true)}>
                  76-char lines
                </button>
                <button data-active={!chunked} onClick={() => setChunked(false)}>
                  Single line
                </button>
              </div>
              <CopyButton value={displayed} className="py-1" />
              <button className="btn" onClick={downloadB64}>
                <Download className="w-3.5 h-3.5" />
                <span>.b64</span>
              </button>
            </div>
          </div>
          <pre className="p-4 font-mono text-[12px] leading-[1.65] text-[var(--amber)] whitespace-pre-wrap break-all max-h-[420px] overflow-auto">
            {displayed}
          </pre>
        </div>
      ) : batch ? (
        <div className="card overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
            <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--amber)]">
              Batch · {batch.length} files
            </span>
            <CopyButton
              value={JSON.stringify(
                batch.map((f) => ({ name: f.name, mime: f.mime, size: f.size, base64: f.base64 })),
                null,
                2
              )}
              label="Copy JSON manifest"
              className="py-1"
            />
          </div>
          <div className="max-h-[460px] overflow-auto divide-y divide-[var(--hairline)]">
            {batch.map((b, i) => (
              <div key={i} className="px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-[12.5px] text-[var(--fg)] truncate">
                      {b.name}
                    </div>
                    <div className="font-mono text-[10.5px] text-[var(--fg-muted)]">
                      {b.mime} · {formatBytes(b.size)}
                    </div>
                  </div>
                  <CopyButton value={b.base64} label="Copy" className="!py-1 !text-[11px]" />
                </div>
                <pre className="mt-1 font-mono text-[11px] text-[var(--amber)] max-h-12 overflow-hidden opacity-80 truncate">
                  {b.base64.slice(0, 160)}...
                </pre>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-6 flex items-center justify-center min-h-[280px]">
          <div className="text-center">
            <FileIcon className="w-8 h-8 mx-auto text-[var(--fg-dim)] mb-2" />
            <p className="text-[14px] text-[var(--fg)]">No file loaded</p>
            <p className="text-[12.5px] text-[var(--fg-muted)] mt-1">
              Drop or select any file to encode it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
