"use client";

import { useMemo, useState } from "react";
import {
  FileCode2,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  FileCode,
  Link2,
  ShieldCheck,
  Terminal,
  Search as SearchIcon,
  Wrench,
} from "lucide-react";
import {
  toCSV,
  toTypeScript,
  toYAML,
  toXML,
  toQueryString,
  escapeForCode,
  type EscapeLang,
} from "@/lib/json-utils";
import { validateSchema, SAMPLE_SCHEMA } from "@/lib/jsonSchema";
import { runJsonPath } from "@/lib/jsonpath";
import { CopyButton } from "@/components/shared/CopyButton";
import { cn } from "@/lib/cn";

type Mode = "ts" | "csv" | "yaml" | "xml" | "qs" | "escape" | "schema" | "jsonpath";

const LANG_OPTIONS: { id: EscapeLang; label: string }[] = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "shell", label: "Shell" },
  { id: "sql", label: "SQL" },
  { id: "java", label: "Java" },
];

export function ConversionPanel({ input }: { input: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("ts");
  const [lang, setLang] = useState<EscapeLang>("javascript");
  const [schemaText, setSchemaText] = useState("");
  const [jsonPathExpr, setJsonPathExpr] = useState("$..email");

  const result = useMemo(() => {
    if (!input.trim()) return { ok: false, error: { message: "Paste JSON above to convert" } } as const;
    switch (mode) {
      case "csv":
        return toCSV(input);
      case "ts":
        return toTypeScript(input);
      case "yaml":
        return toYAML(input);
      case "xml":
        return toXML(input);
      case "qs":
        return toQueryString(input);
      case "escape":
        return { ok: true, value: escapeForCode(input, lang) } as const;
      default:
        return { ok: true, value: "" } as const;
    }
  }, [input, mode, lang]);

  const schemaResult = useMemo(
    () => (mode === "schema" ? validateSchema(input, schemaText) : null),
    [mode, input, schemaText]
  );
  const jsonPathResult = useMemo(
    () => (mode === "jsonpath" ? runJsonPath(input, jsonPathExpr) : null),
    [mode, input, jsonPathExpr]
  );

  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-[var(--hairline)] bg-[var(--bg-card)] hover:border-[var(--hairline-strong)] transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--cyan)]">
            Conversions · Validate · Query
          </span>
          <span className="text-[var(--fg)] text-[14px]">
            TypeScript · CSV · YAML · XML · JSONPath · Schema · Escape
          </span>
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[var(--fg-muted)] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="mt-3 animate-fade-in">
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <ModeButton active={mode === "ts"} onClick={() => setMode("ts")} icon={<FileCode2 className="w-3.5 h-3.5" />}>TypeScript</ModeButton>
            <ModeButton active={mode === "csv"} onClick={() => setMode("csv")} icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>CSV</ModeButton>
            <ModeButton active={mode === "yaml"} onClick={() => setMode("yaml")} icon={<FileText className="w-3.5 h-3.5" />}>YAML</ModeButton>
            <ModeButton active={mode === "xml"} onClick={() => setMode("xml")} icon={<FileCode className="w-3.5 h-3.5" />}>XML</ModeButton>
            <ModeButton active={mode === "qs"} onClick={() => setMode("qs")} icon={<Link2 className="w-3.5 h-3.5" />}>Query string</ModeButton>
            <ModeButton active={mode === "escape"} onClick={() => setMode("escape")} icon={<Terminal className="w-3.5 h-3.5" />}>Escape for code</ModeButton>
            <ModeButton active={mode === "schema"} onClick={() => setMode("schema")} icon={<ShieldCheck className="w-3.5 h-3.5" />}>Schema validate</ModeButton>
            <ModeButton active={mode === "jsonpath"} onClick={() => setMode("jsonpath")} icon={<SearchIcon className="w-3.5 h-3.5" />}>JSONPath</ModeButton>
          </div>

          {mode === "escape" && (
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                Target language
              </span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as EscapeLang)}
                className="bg-[var(--bg-raise)] border border-[var(--hairline)] rounded px-2 py-1 text-[12.5px] text-[var(--fg)] font-mono"
              >
                {LANG_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "schema" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
                  <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                    JSON Schema (draft 2020-12)
                  </span>
                  <button
                    className="btn btn-ghost py-1 !text-[11px]"
                    onClick={() => setSchemaText(SAMPLE_SCHEMA)}
                  >
                    <Wrench className="w-3 h-3" /> Load example
                  </button>
                </div>
                <textarea
                  value={schemaText}
                  onChange={(e) => setSchemaText(e.target.value)}
                  spellCheck={false}
                  placeholder="Paste a JSON Schema here..."
                  className="editor-input w-full px-3 py-2 text-[12.5px]"
                  style={{ minHeight: 200 }}
                />
              </div>
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
                  <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                    Validation result
                  </span>
                  {schemaResult?.ok && (
                    <span
                      className={cn(
                        "badge",
                        schemaResult.valid ? "badge-ok" : "badge-err"
                      )}
                    >
                      {schemaResult.valid ? "Valid" : `${schemaResult.errors.length} errors`}
                    </span>
                  )}
                </div>
                <div className="p-3 text-[12.5px] max-h-[280px] overflow-auto">
                  {schemaResult?.parseError && (
                    <p className="text-[var(--rose)]">{schemaResult.parseError}</p>
                  )}
                  {schemaResult?.ok && schemaResult.valid && (
                    <p className="text-[var(--cyan)]">Data conforms to schema ✓</p>
                  )}
                  {schemaResult?.ok && !schemaResult.valid && (
                    <ul className="space-y-1.5">
                      {schemaResult.errors.map((e, i) => (
                        <li key={i} className="border-l-2 border-[var(--rose)] pl-2">
                          <span className="font-mono text-[11px] text-[var(--rose)]">
                            {e.instanceLocation || "/"}
                          </span>
                          <span className="ml-2 font-mono text-[11px] text-[var(--fg-dim)]">
                            ({e.keyword})
                          </span>
                          <div className="text-[12.5px] text-[var(--fg)]">{e.message}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {mode === "jsonpath" && (
            <div className="mb-3 card overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
                <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                  Expression
                </span>
                <input
                  value={jsonPathExpr}
                  onChange={(e) => setJsonPathExpr(e.target.value)}
                  className="flex-1 bg-transparent font-mono text-[13px] text-[var(--fg)] outline-none"
                  placeholder="$..email · $.store.book[*].author · $.users[?(@.active==true)]"
                  spellCheck={false}
                />
                {jsonPathResult?.ok && (
                  <span className="badge badge-info">{jsonPathResult.matches.length} matches</span>
                )}
              </div>
              <div className="p-3 max-h-[280px] overflow-auto">
                {jsonPathResult?.error && (
                  <p className="text-[var(--rose)] text-[12.5px]">{jsonPathResult.error}</p>
                )}
                {jsonPathResult?.ok && jsonPathResult.matches.length === 0 && (
                  <p className="text-[var(--fg-muted)] text-[12.5px]">No matches</p>
                )}
                {jsonPathResult?.ok && jsonPathResult.matches.length > 0 && (
                  <pre className="font-mono text-[12.5px] leading-[1.65] whitespace-pre-wrap break-all text-[var(--fg)]">
                    {JSON.stringify(jsonPathResult.matches, null, 2)}
                  </pre>
                )}
              </div>
              {jsonPathResult?.ok && jsonPathResult.matches.length > 0 && (
                <div className="px-3 py-2 border-t border-[var(--hairline)] bg-[var(--bg-soft)] flex items-center justify-between">
                  <span className="font-mono text-[10.5px] text-[var(--fg-dim)]">
                    {jsonPathResult.paths.slice(0, 3).join(" · ")}
                    {jsonPathResult.paths.length > 3 && ` · +${jsonPathResult.paths.length - 3}`}
                  </span>
                  <CopyButton
                    value={JSON.stringify(jsonPathResult.matches, null, 2)}
                    label="Copy matches"
                    className="py-1"
                  />
                </div>
              )}
            </div>
          )}

          {mode !== "schema" && mode !== "jsonpath" && (
            <div className="editor-surface overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)]">
                <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                  {labelFor(mode, lang)}
                </span>
                <CopyButton value={result.ok ? result.value : ""} disabled={!result.ok} className="py-1" />
              </div>
              <pre className="px-4 py-3 font-mono text-[12.5px] leading-[1.7] whitespace-pre overflow-auto max-h-[360px] min-h-[120px]">
                {result.ok ? (
                  result.value
                ) : (
                  <span className="text-[var(--rose)]">{result.error.message}</span>
                )}
              </pre>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function labelFor(mode: Mode, lang: EscapeLang): string {
  switch (mode) {
    case "ts": return "Generated TypeScript";
    case "csv": return "CSV export";
    case "yaml": return "YAML export";
    case "xml": return "XML export";
    case "qs": return "Query string";
    case "escape": return `Escaped for ${lang}`;
    default: return "";
  }
}

function ModeButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "btn text-[12.5px] py-1.5",
        active && "bg-white/[0.06] border-[var(--hairline-strong)] text-[var(--fg)]"
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
