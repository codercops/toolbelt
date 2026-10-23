"use client";

import { useMemo, useRef, type KeyboardEvent } from "react";
import { Download } from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadBlob } from "@/lib/download";
import { cn } from "@/lib/cn";
import {
  csvToJson,
  csvToSql,
  csvToTypeScript,
  csvToYaml,
  formatCsv,
  prettifyCsv,
  type ParsedCsv,
} from "@/lib/csv-utils";

export const OUTPUT_TABS = [
  { id: "table", label: "Table" },
  { id: "csv", label: "CSV" },
  { id: "json", label: "JSON" },
  { id: "typescript", label: "TypeScript" },
  { id: "yaml", label: "YAML" },
  { id: "sql", label: "SQL" },
  { id: "aligned", label: "Aligned" },
] as const;

export type OutputTab = (typeof OUTPUT_TABS)[number]["id"];

const TABLE_PREVIEW_LIMIT = 200;

interface OutputPanelProps {
  parsed: ParsedCsv;
  tab: OutputTab;
  onTabChange: (tab: OutputTab) => void;
  tableName: string;
  onTableNameChange: (name: string) => void;
  typeName: string;
  onTypeNameChange: (name: string) => void;
}

function buildOutput(
  tab: OutputTab,
  parsed: ParsedCsv,
  tableName: string,
  typeName: string,
): string {
  switch (tab) {
    case "csv":
      return formatCsv(parsed.header, parsed.rows, {
        delimiter: parsed.delimiter,
        lineEnding: parsed.lineEnding,
      });
    case "json":
      return JSON.stringify(csvToJson(parsed.header, parsed.rows), null, 2);
    case "typescript":
      return csvToTypeScript(parsed.header, typeName);
    case "yaml":
      return csvToYaml(parsed.header, parsed.rows);
    case "sql":
      return csvToSql(parsed.header, parsed.rows, tableName);
    case "aligned":
      return prettifyCsv(parsed.header, parsed.rows);
    default:
      return "";
  }
}

function downloadDetails(tab: OutputTab, typeName: string, delimiter: string) {
  switch (tab) {
    case "csv":
      return {
        filename: delimiter === "\t" ? "data.tsv" : "data.csv",
        mime:
          delimiter === "\t"
            ? "text/tab-separated-values;charset=utf-8"
            : "text/csv;charset=utf-8",
      };
    case "json":
      return { filename: "data.json", mime: "application/json;charset=utf-8" };
    case "typescript":
      return {
        filename: `${typeName.replace(/[^A-Za-z0-9_$-]/g, "") || "Row"}.ts`,
        mime: "text/plain;charset=utf-8",
      };
    case "yaml":
      return { filename: "data.yaml", mime: "text/yaml;charset=utf-8" };
    case "sql":
      return { filename: "inserts.sql", mime: "application/sql;charset=utf-8" };
    case "aligned":
      return { filename: "table.txt", mime: "text/plain;charset=utf-8" };
    default:
      return null;
  }
}

export function OutputPanel({
  parsed,
  tab,
  onTabChange,
  tableName,
  onTableNameChange,
  typeName,
  onTypeNameChange,
}: OutputPanelProps) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const output = useMemo(
    () => buildOutput(tab, parsed, tableName, typeName),
    [tab, parsed, tableName, typeName],
  );
  const download = downloadDetails(tab, typeName, parsed.delimiter);
  const previewRows = parsed.rows.slice(0, TABLE_PREVIEW_LIMIT);
  const hiddenRows = parsed.rows.length - previewRows.length;

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = OUTPUT_TABS.length - 1;
    let next = index;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;

    event.preventDefault();
    const nextTab = OUTPUT_TABS[next];
    onTabChange(nextTab.id);
    tabRefs.current[nextTab.id]?.focus();
  }

  return (
    <section className="card overflow-hidden" aria-label="Converted output">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] bg-[var(--bg-raise)] px-3 py-2">
        <div role="tablist" aria-label="Output format" className="flex flex-wrap gap-1">
          {OUTPUT_TABS.map((entry, index) => (
            <button
              key={entry.id}
              ref={(element) => {
                tabRefs.current[entry.id] = element;
              }}
              id={`csv-tab-${entry.id}`}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              aria-controls="csv-output-panel"
              tabIndex={tab === entry.id ? 0 : -1}
              onClick={() => onTabChange(entry.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={cn(
                "btn py-1",
                tab === entry.id && "bg-white/[0.06] border-[var(--hairline-strong)]",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tab === "typescript" && (
            <label className="flex items-center gap-1.5 text-[12px] font-mono text-[var(--fg-muted)]">
              Interface
              <input
                type="text"
                value={typeName}
                onChange={(event) => onTypeNameChange(event.target.value)}
                spellCheck={false}
                className="w-24 rounded-md border border-[var(--hairline)] bg-[var(--bg)] px-2 py-1 font-mono text-[12px] text-[var(--fg)]"
              />
            </label>
          )}
          {tab === "sql" && (
            <label className="flex items-center gap-1.5 text-[12px] font-mono text-[var(--fg-muted)]">
              Table
              <input
                type="text"
                value={tableName}
                onChange={(event) => onTableNameChange(event.target.value)}
                spellCheck={false}
                className="w-28 rounded-md border border-[var(--hairline)] bg-[var(--bg)] px-2 py-1 font-mono text-[12px] text-[var(--fg)]"
              />
            </label>
          )}
          {download && (
            <>
              <CopyButton
                value={() => output}
                label="Copy"
                successMessage={`${OUTPUT_TABS.find((entry) => entry.id === tab)?.label ?? "Output"} copied`}
                disabled={output.length === 0}
              />
              <button
                type="button"
                className="btn"
                onClick={() => downloadBlob(output, download.filename, download.mime)}
                disabled={output.length === 0}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div
        id="csv-output-panel"
        role="tabpanel"
        aria-labelledby={`csv-tab-${tab}`}
        tabIndex={0}
        className="focus-visible:outline-none"
      >
        {tab === "table" ? (
          parsed.header.length === 0 ? (
            <p className="p-4 text-sm text-[var(--fg-muted)]">Nothing to show yet.</p>
          ) : (
            <>
              <div className="max-h-[32rem] overflow-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <caption className="sr-only">
                    Parsed CSV table, {parsed.rowCount} data row
                    {parsed.rowCount === 1 ? "" : "s"} and {parsed.columnCount} column
                    {parsed.columnCount === 1 ? "" : "s"}
                  </caption>
                  <thead className="sticky top-0 bg-[var(--bg-raise)] shadow-[inset_0_-1px_0_var(--hairline)]">
                    <tr>
                      {parsed.header.map((name, index) => (
                        <th
                          key={`${name}-${index}`}
                          scope="col"
                          className="whitespace-nowrap px-3 py-2 font-mono text-[11px] tracking-wide text-[var(--fg-dim)]"
                        >
                          {name.trim() || `column_${index + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline)] align-top">
                    {previewRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-white/[0.02]">
                        {parsed.header.map((_, columnIndex) => (
                          <td
                            key={columnIndex}
                            className="max-w-[28rem] whitespace-pre-wrap break-words px-3 py-2 text-[var(--fg)]"
                          >
                            {row[columnIndex] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--hairline)] px-3 py-2 text-[12px] text-[var(--fg-muted)]">
                <span>
                  Showing {previewRows.length} of {parsed.rowCount} row
                  {parsed.rowCount === 1 ? "" : "s"}
                  {hiddenRows > 0 ? " — download the CSV or JSON for the rest." : "."}
                </span>
                <span className="font-mono">
                  {parsed.rows.length === 0 ? "header only" : `${parsed.columnCount} columns`}
                </span>
              </div>
            </>
          )
        ) : (
          <pre className="max-h-[32rem] overflow-auto p-4 font-mono text-[12.5px] leading-relaxed text-[var(--fg)]">
            {output}
          </pre>
        )}
      </div>
    </section>
  );
}
