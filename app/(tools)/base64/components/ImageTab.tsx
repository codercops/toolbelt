"use client";

import { useRef, useState } from "react";
import { Upload, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";
import { useToast } from "@/components/shared/Toast";
import { bytesToBase64, formatBytes } from "@/lib/base64-utils";
import { cn } from "@/lib/cn";

interface ImageInfo {
  name: string;
  mime: string;
  size: number;
  width: number;
  height: number;
  dataUri: string;
  base64Only: string;
}

export function ImageTab() {
  const [info, setInfo] = useState<ImageInfo | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { push } = useToast();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      push("That doesn't look like an image file", "error");
      return;
    }
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const base64 = bytesToBase64(buf, { urlSafe: false, padding: true });
      const dataUri = `data:${file.type};base64,${base64}`;
      const dims = await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 0, height: 0 });
        img.src = dataUri;
      });
      setInfo({
        name: file.name,
        mime: file.type,
        size: file.size,
        width: dims.width,
        height: dims.height,
        dataUri,
        base64Only: base64,
      });
    } catch {
      push(`Could not read ${file.name}`, "error");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const htmlSnippet = info
    ? `<img src="${info.dataUri.slice(0, 40)}..." alt="${info.name}" width="${info.width}" height="${info.height}" />`
    : "";
  const cssSnippet = info
    ? `background-image: url("${info.dataUri.slice(0, 40)}...");`
    : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
      <div>
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
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {info ? (
            <div className="animate-fade-in">
              <div className="mx-auto mb-3 overflow-hidden rounded-md border border-[var(--hairline)] bg-black/30 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={info.dataUri}
                  alt={info.name}
                  style={{
                    maxWidth: 200,
                    maxHeight: 200,
                    display: "block",
                  }}
                />
              </div>
              <div className="font-mono text-[12px] text-[var(--fg)] break-all">{info.name}</div>
              <div className="mt-1 font-mono text-[11px] text-[var(--fg-muted)]">
                {info.mime} · {formatBytes(info.size)} · {info.width}×{info.height}
              </div>
              <button className="btn mt-3" onClick={(e) => { e.stopPropagation(); setInfo(null); }}>
                Replace image
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-6 h-6 mx-auto text-[var(--fg-dim)] mb-2" />
              <div className="text-[14px] text-[var(--fg)]">
                Drop an image here
              </div>
              <div className="mt-1 text-[12px] text-[var(--fg-muted)]">
                or click to browse · PNG, JPG, GIF, WebP, SVG
              </div>
            </div>
          )}
        </div>

        {info && info.size > 100 * 1024 && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-md border border-[rgba(255,181,71,0.3)] bg-[rgba(255,181,71,0.06)]">
            <AlertTriangle className="w-4 h-4 text-[var(--amber)] mt-0.5 shrink-0" />
            <p className="text-[12.5px] text-[var(--fg-muted)]">
              Large images in base64 may slow page loads. Consider using a CDN instead.
            </p>
          </div>
        )}
      </div>

      {info ? (
        <div className="space-y-3 animate-fade-in">
          <OutputBlock label="Full data URI" value={info.dataUri} wrap />
          <OutputBlock label="Base64 only (no prefix)" value={info.base64Only} wrap />
          <OutputBlock label="HTML <img> tag" value={htmlSnippet} full={`<img src="${info.dataUri}" alt="${info.name}" width="${info.width}" height="${info.height}" />`} />
          <OutputBlock label="CSS background-image" value={cssSnippet} full={`background-image: url("${info.dataUri}");`} />
        </div>
      ) : (
        <div className="card p-6 flex items-center justify-center min-h-[280px]">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 mx-auto text-[var(--fg-dim)] mb-2" />
            <p className="text-[14px] text-[var(--fg)]">No image loaded</p>
            <p className="text-[12.5px] text-[var(--fg-muted)] mt-1">
              Drop or select an image to generate its data URI.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function OutputBlock({
  label,
  value,
  full,
  wrap,
}: {
  label: string;
  value: string;
  full?: string;
  wrap?: boolean;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
        <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
          {label}
        </span>
        <CopyButton value={full ?? value} className="py-1" />
      </div>
      <pre
        className={cn(
          "p-3 font-mono text-[12px] leading-[1.65] text-[var(--amber)] max-h-48 overflow-auto",
          wrap ? "whitespace-pre-wrap break-all" : "whitespace-pre-wrap break-all"
        )}
      >
        {value}
      </pre>
    </div>
  );
}
