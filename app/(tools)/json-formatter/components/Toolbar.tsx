"use client";

import {
  Braces,
  Minimize2,
  ShieldCheck,
  Trash2,
  Download,
  Sparkles,
  ArrowDownAZ,
  GitCompare,
  BarChart3,
  FileQuestion,
  Search,
} from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";
import { ShortcutsLegend } from "@/components/shared/ShortcutsLegend";
import { cn } from "@/lib/cn";

interface ToolbarProps {
  indent: 2 | 4;
  onIndentChange: (i: 2 | 4) => void;
  onFormat: () => void;
  onMinify: () => void;
  onValidate: () => void;
  onClear: () => void;
  onDownload: () => void;
  onLoadSample: () => void;
  onSort: () => void;
  onToggleDiff: () => void;
  diffOpen: boolean;
  onToggleStats: () => void;
  statsOpen: boolean;
  onFind: () => void;
  output: string;
  json5: boolean;
  onJson5Toggle: (on: boolean) => void;
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

export function Toolbar({
  indent,
  onIndentChange,
  onFormat,
  onMinify,
  onValidate,
  onClear,
  onDownload,
  onLoadSample,
  onSort,
  onToggleDiff,
  diffOpen,
  onToggleStats,
  statsOpen,
  onFind,
  output,
  json5,
  onJson5Toggle,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border border-[var(--hairline)] rounded-lg bg-[var(--bg-card)]">
      <button type="button" className="btn btn-primary" onClick={onFormat}>
        <Braces className="w-3.5 h-3.5" />
        <span>Format</span>
      </button>
      <button type="button" className="btn" onClick={onMinify}>
        <Minimize2 className="w-3.5 h-3.5" />
        <span>Minify</span>
      </button>
      <button type="button" className="btn" onClick={onValidate}>
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Validate</span>
      </button>
      <button type="button" className="btn" onClick={onSort} title="Sort object keys alphabetically (recursive)">
        <ArrowDownAZ className="w-3.5 h-3.5" />
        <span>Sort keys</span>
      </button>

      <span className="mx-1 h-5 w-px bg-[var(--hairline)]" />

      <div className="segmented" role="group" aria-label="Indent size">
        <button data-active={indent === 2} onClick={() => onIndentChange(2)}>
          2 sp
        </button>
        <button data-active={indent === 4} onClick={() => onIndentChange(4)}>
          4 sp
        </button>
      </div>

      <label className="flex items-center gap-1.5 text-[12px] font-mono text-[var(--fg-muted)] px-1.5">
        <input
          type="checkbox"
          checked={json5}
          onChange={(e) => onJson5Toggle(e.target.checked)}
          className="accent-[var(--cyan)]"
        />
        <span title="Accept JSON5 — comments, trailing commas, unquoted keys">JSON5</span>
      </label>

      <span className="mx-1 h-5 w-px bg-[var(--hairline)]" />

      <CopyButton value={() => output} label="Copy" disabled={!output} />
      <button type="button" className="btn" onClick={onDownload} disabled={!output}>
        <Download className="w-3.5 h-3.5" />
        <span>Download</span>
      </button>
      <button type="button" className="btn" onClick={onFind} title="Find in input (⌘F)">
        <Search className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Find</span>
      </button>

      <span className="mx-1 h-5 w-px bg-[var(--hairline)]" />

      <button
        type="button"
        className={cn("btn", diffOpen && "bg-white/[0.06] border-[var(--hairline-strong)]")}
        onClick={onToggleDiff}
        aria-pressed={diffOpen}
      >
        <GitCompare className="w-3.5 h-3.5" />
        <span>Diff</span>
      </button>
      <button
        type="button"
        className={cn("btn", statsOpen && "bg-white/[0.06] border-[var(--hairline-strong)]")}
        onClick={onToggleStats}
        aria-pressed={statsOpen}
      >
        <BarChart3 className="w-3.5 h-3.5" />
        <span>Stats</span>
      </button>

      <span className="flex-1" />

      <button type="button" className="btn" onClick={onLoadSample}>
        <Sparkles className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Load example</span>
      </button>
      <button
        type="button"
        className="btn btn-danger"
        onClick={onClear}
        title="Clear all"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Clear</span>
      </button>
      <ShortcutsLegend
        shortcuts={[
          { keys: [MOD, "Enter"], label: "Format" },
          { keys: [MOD, "M"], label: "Minify" },
          { keys: [MOD, "F"], label: "Find in input" },
          { keys: [MOD, "⇧", "S"], label: "Sort keys" },
          { keys: [MOD, "⇧", "K"], label: "Clear all" },
          { keys: [MOD, "D"], label: "Download" },
          { keys: [MOD, "K"], label: "Command palette" },
        ]}
      />
      <span className="sr-only">
        <FileQuestion className="w-3 h-3" /> legend placeholder
      </span>
    </div>
  );
}
