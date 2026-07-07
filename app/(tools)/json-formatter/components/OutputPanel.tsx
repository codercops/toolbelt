"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, List, TreePine, FoldVertical, UnfoldVertical } from "lucide-react";
import { tokenize } from "@/lib/json-utils";
import { cn } from "@/lib/cn";

interface OutputPanelProps {
  output: string;
  theme?: "dark" | "light";
}

type ViewMode = "code" | "tree";

export function OutputPanel({ output, theme = "dark" }: OutputPanelProps) {
  const [mode, setMode] = useState<ViewMode>("code");
  const [treeVersion, setTreeVersion] = useState(0);
  const [forceOpen, setForceOpen] = useState<boolean | null>(null);

  if (!output) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[420px] border border-dashed border-[var(--hairline-strong)] rounded-lg bg-[var(--bg-soft)]">
        <div className="text-center px-6">
          <div className="mx-auto w-10 h-10 rounded-lg border border-[var(--hairline)] bg-[var(--bg-card)] flex items-center justify-center mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[var(--fg-dim)]">
              <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[var(--fg-muted)] text-[14px]">Your formatted JSON will appear here</p>
          <p className="text-[var(--fg-dim)] text-[12px] mt-1">Paste JSON and press Format</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex-1 flex flex-col min-h-[420px] rounded-lg overflow-hidden border border-[var(--hairline)]",
        theme === "light" ? "bg-[#FAFAFA] text-[#1a1a1a]" : "bg-[var(--bg-soft)]"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-card)] gap-2 flex-wrap">
        <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
          Output · {output.split("\n").length} lines · {output.length} chars
        </span>
        <div className="flex items-center gap-1.5">
          {mode === "tree" && (
            <>
              <button
                type="button"
                className="btn btn-ghost !py-1 !text-[11px]"
                onClick={() => {
                  setForceOpen(true);
                  setTreeVersion((v) => v + 1);
                }}
                title="Expand all"
              >
                <UnfoldVertical className="w-3 h-3" />
                Expand
              </button>
              <button
                type="button"
                className="btn btn-ghost !py-1 !text-[11px]"
                onClick={() => {
                  setForceOpen(false);
                  setTreeVersion((v) => v + 1);
                }}
                title="Collapse all"
              >
                <FoldVertical className="w-3 h-3" />
                Collapse
              </button>
            </>
          )}
          <div className="segmented" role="group" aria-label="View mode">
            <button
              type="button"
              data-active={mode === "code"}
              onClick={() => setMode("code")}
              title="Code view"
            >
              <List className="w-3 h-3 inline -mt-px mr-1" />
              Code
            </button>
            <button
              type="button"
              data-active={mode === "tree"}
              onClick={() => setMode("tree")}
              title="Tree view"
            >
              <TreePine className="w-3 h-3 inline -mt-px mr-1" />
              Tree
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto animate-fade-in">
        {mode === "code" ? (
          <CodeView output={output} theme={theme} />
        ) : (
          <TreeView output={output} key={treeVersion} forceOpen={forceOpen} />
        )}
      </div>
    </div>
  );
}

function CodeView({ output, theme }: { output: string; theme: "dark" | "light" }) {
  const tokens = useMemo(() => tokenize(output), [output]);
  const lineCount = output.split("\n").length;
  const lineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1).join("\n"),
    [lineCount]
  );

  return (
    <div className="grid grid-cols-[auto_1fr] font-mono text-[13px] leading-[1.65]">
      <pre className="ln-gutter py-3 pl-3 pr-3 select-none">{lineNumbers}</pre>
      <pre className={cn("py-3 pr-4 pl-3 whitespace-pre", theme === "light" && "text-[#222]")}>
        {tokens.map((t, i) => {
          if (t.kind === "ws") return <span key={i}>{t.value}</span>;
          const cls =
            t.kind === "key"
              ? "tok-key"
              : t.kind === "string"
              ? "tok-string"
              : t.kind === "number"
              ? "tok-number"
              : t.kind === "bool"
              ? "tok-bool"
              : t.kind === "null"
              ? "tok-null"
              : t.kind === "brace"
              ? "tok-brace"
              : "tok-punct";
          return (
            <span key={i} className={cls}>
              {t.value}
            </span>
          );
        })}
      </pre>
    </div>
  );
}

/* Tree view */
function TreeView({ output, forceOpen }: { output: string; forceOpen: boolean | null }) {
  const data = useMemo(() => {
    try {
      return { ok: true, value: JSON.parse(output) } as const;
    } catch {
      return { ok: false } as const;
    }
  }, [output]);
  if (!data.ok) {
    return <div className="p-4 font-mono text-[13px] text-[var(--rose)]">Could not parse tree view</div>;
  }
  return (
    <div className="p-3 font-mono text-[13px] leading-[1.65]">
      <TreeNode value={data.value} name={null} depth={0} isLast forceOpen={forceOpen} />
    </div>
  );
}

function TreeNode({
  value,
  name,
  depth,
  isLast,
  forceOpen,
}: {
  value: unknown;
  name: string | null;
  depth: number;
  isLast: boolean;
  forceOpen: boolean | null;
}) {
  const defaultOpen = forceOpen === null ? depth < 2 : forceOpen;
  const [open, setOpen] = useState(defaultOpen);
  const isObj = value !== null && typeof value === "object" && !Array.isArray(value);
  const isArr = Array.isArray(value);
  const isContainer = isObj || isArr;
  const entries = isObj
    ? Object.entries(value as Record<string, unknown>)
    : isArr
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : [];
  const count = entries.length;

  const key =
    name !== null ? (
      <>
        <span className="tok-key">&quot;{name}&quot;</span>
        <span className="tok-punct">: </span>
      </>
    ) : null;

  if (!isContainer) {
    return (
      <div style={{ paddingLeft: depth * 18 }} className="flex items-start">
        <span className="w-4 shrink-0" />
        <span>
          {key}
          <ValueToken value={value} />
          {!isLast && <span className="tok-punct">,</span>}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ paddingLeft: depth * 18 }} className="flex items-start">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-4 h-[1.65em] shrink-0 flex items-center text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
          aria-label={open ? "Collapse" : "Expand"}
        >
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        <span>
          {key}
          <span className="tok-brace">{isArr ? "[" : "{"}</span>
          {!open && (
            <span className="text-[var(--fg-dim)] ml-1">
              {count} {isArr ? (count === 1 ? "item" : "items") : count === 1 ? "key" : "keys"}
            </span>
          )}
          {!open && <span className="tok-brace">{isArr ? "]" : "}"}</span>}
          {!open && !isLast && <span className="tok-punct">,</span>}
        </span>
      </div>
      {open && (
        <>
          <div
            className="relative"
            style={{
              paddingLeft: depth * 18 + 8,
            }}
          >
            <div
              className="absolute top-0 bottom-0 w-px bg-[var(--hairline)]"
              style={{ left: depth * 18 + 7 }}
            />
            {entries.map(([k, v], i) => (
              <TreeNode
                key={k}
                name={isArr ? null : k}
                value={v}
                depth={depth + 1}
                isLast={i === entries.length - 1}
                forceOpen={forceOpen}
              />
            ))}
          </div>
          <div style={{ paddingLeft: depth * 18 + 18 }} className="flex items-start">
            <span className="tok-brace">{isArr ? "]" : "}"}</span>
            {!isLast && <span className="tok-punct">,</span>}
          </div>
        </>
      )}
    </div>
  );
}

function ValueToken({ value }: { value: unknown }) {
  if (value === null) return <span className="tok-null">null</span>;
  if (typeof value === "string") return <span className="tok-string">&quot;{value}&quot;</span>;
  if (typeof value === "number") return <span className="tok-number">{String(value)}</span>;
  if (typeof value === "boolean") return <span className="tok-bool">{String(value)}</span>;
  return <span>{String(value)}</span>;
}
