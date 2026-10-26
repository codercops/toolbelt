"use client";

import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import { FileUp, Sparkles, Trash2 } from "lucide-react";
import { useRegisterCommands } from "@/components/shared/CommandPalette";
import { useToast } from "@/components/shared/Toast";
import {
  DELIMITERS,
  SAMPLE_CSV,
  delimiterLabel,
  parseCsv,
  type CsvDelimiter,
} from "@/lib/csv-utils";
import { IssueList } from "./components/IssueList";
import { OutputPanel, type OutputTab } from "./components/OutputPanel";
import { StatsBar } from "./components/StatsBar";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

type DelimiterChoice = CsvDelimiter | "auto";

export function CsvFormatterClient() {
  const { push } = useToast();
  const [input, setInput] = useState("");
  const [delimiter, setDelimiter] = useState<DelimiterChoice>("auto");
  const [hasHeader, setHasHeader] = useState(true);
  const [tab, setTab] = useState<OutputTab>("table");
  const [tableName, setTableName] = useState("records");
  const [typeName, setTypeName] = useState("Row");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsing is deferred so typing in a large paste never blocks the caret.
  const deferredInput = useDeferredValue(input);
  const parsed = useMemo(
    () => parseCsv(deferredInput, { delimiter, hasHeader }),
    [deferredInput, delimiter, hasHeader],
  );

  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE_CSV);
    setDelimiter("auto");
    setHasHeader(true);
    setTab("table");
    setFileName(null);
    push("Example CSV loaded", "success");
  }, [push]);

  const handleClear = useCallback(() => {
    setInput("");
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (file.size > MAX_FILE_BYTES) {
        push("That file is larger than 10 MB. Paste a smaller sample instead.", "error");
        return;
      }
      try {
        const text = await file.text();
        setInput(text);
        setFileName(file.name);
        setTab("table");
        push(`${file.name} loaded`, "success");
      } catch {
        push("Could not read that file", "error");
      }
    },
    [push],
  );

  useRegisterCommands(
    "csv-formatter",
    [
      {
        id: "csv:sample",
        section: "CSV Formatter",
        title: "Load example",
        run: handleLoadSample,
      },
      {
        id: "csv:clear",
        section: "CSV Formatter",
        title: "Clear input",
        run: handleClear,
      },
      {
        id: "csv:json",
        section: "CSV Formatter",
        title: "Switch output to JSON",
        run: () => setTab("json"),
      },
      {
        id: "csv:sql",
        section: "CSV Formatter",
        title: "Switch output to SQL",
        run: () => setTab("sql"),
      },
    ],
    [handleLoadSample, handleClear],
  );

  return (
    <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10 space-y-4">
      <div className="card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="csv-input"
            className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]"
          >
            CSV or TSV input
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn" onClick={handleLoadSample}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load example</span>
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload file</span>
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleClear}
              disabled={input.length === 0}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
              className="sr-only"
              aria-label="Upload a CSV or TSV file"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
          </div>
        </div>

        <div>
          <textarea
            id="csv-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setFileName(null);
            }}
            rows={10}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder={'name,email\nAda Lovelace,ada@example.com\n"Grace Hopper",grace@example.com'}
            aria-describedby="csv-input-hint"
            className="w-full resize-y rounded-xl border border-[var(--hairline)] bg-[var(--bg)] p-3 font-mono text-[13px] leading-relaxed text-[var(--fg)] placeholder:text-[var(--fg-dim)] focus-visible:border-[var(--hairline-strong)] focus-visible:outline-none"
          />
          <p id="csv-input-hint" className="mt-1.5 text-[12.5px] text-[var(--fg-muted)]">
            Paste CSV or TSV, or upload a file. Everything is parsed in your browser — nothing is
            uploaded.
            {fileName && (
              <span className="ml-1 font-mono text-[var(--fg-dim)]">Loaded from {fileName}.</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-mono text-[var(--fg-muted)]">Delimiter</span>
            <div className="segmented" role="group" aria-label="Delimiter">
              <button
                type="button"
                aria-pressed={delimiter === "auto"}
                data-active={delimiter === "auto"}
                onClick={() => setDelimiter("auto")}
              >
                Auto
              </button>
              {DELIMITERS.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  title={entry.label}
                  aria-pressed={delimiter === entry.value}
                  data-active={delimiter === entry.value}
                  onClick={() => setDelimiter(entry.value)}
                >
                  {entry.short}
                </button>
              ))}
            </div>
            {delimiter === "auto" && !parsed.empty && (
              <span className="font-mono text-[11.5px] text-[var(--fg-dim)]">
                detected {delimiterLabel(parsed.delimiter)}
              </span>
            )}
          </div>

          <label className="flex items-center gap-1.5 text-[12px] font-mono text-[var(--fg-muted)]">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(event) => setHasHeader(event.target.checked)}
              className="accent-[var(--cyan)]"
            />
            First row is the header
          </label>
        </div>
      </div>

      {parsed.empty ? (
        <div className="card border-dashed p-8 text-center">
          <p className="text-sm text-[var(--fg-muted)]">
            Paste some CSV or TSV above, or{" "}
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-[var(--cyan)] underline underline-offset-2 hover:no-underline"
            >
              load the example
            </button>
            , to see the parsed table and conversions.
          </p>
        </div>
      ) : (
        <>
          <StatsBar parsed={parsed} input={input} />
          <IssueList issues={parsed.issues} />
          <OutputPanel
            parsed={parsed}
            tab={tab}
            onTabChange={setTab}
            tableName={tableName}
            onTableNameChange={setTableName}
            typeName={typeName}
            onTypeNameChange={setTypeName}
          />
        </>
      )}
    </section>
  );
}
