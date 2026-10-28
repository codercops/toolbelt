"use client";

import { useMemo, useState } from "react";
import { compareJson } from "@/lib/json-diff";

export function DiffPanel({ leftInput }: { leftInput: string }) {
  const [originalDraft, setOriginal] = useState<string | null>(null);
  const original = originalDraft ?? leftInput;
  const [updated, setUpdated] = useState("");
  const [ignoreKeyOrder, setIgnoreKeyOrder] = useState(true);
  const result = useMemo(() => compareJson(original, updated, ignoreKeyOrder), [original, updated, ignoreKeyOrder]);
  return (
    <section className="card p-4 space-y-4" aria-label="JSON diff">
      <h2 className="text-[var(--fg)]">JSON diff</h2>
      <p className="text-sm text-[var(--fg-muted)]">Arrays are compared by index; inserting an element may change subsequent indexes. Limit: 500,000 characters per input and 500 displayed changes.</p>
      <div className="flex flex-wrap gap-4 items-center">
        <label><input type="checkbox" checked={ignoreKeyOrder} onChange={e => setIgnoreKeyOrder(e.target.checked)} /> Ignore key order</label>
        <button type="button" className="btn" onClick={() => { setOriginal(updated); setUpdated(original); }}>Swap inputs</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <label>Original JSON<textarea className="editor-input w-full min-h-40 rounded-md border border-[var(--hairline-strong)] bg-[var(--bg-soft)] p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--cyan)]" value={original} onChange={e => setOriginal(e.target.value)} spellCheck={false} /></label>
        <label>Updated JSON<textarea className="editor-input w-full min-h-40 rounded-md border border-[var(--hairline-strong)] bg-[var(--bg-soft)] p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--cyan)]" value={updated} onChange={e => setUpdated(e.target.value)} spellCheck={false} /></label>
      </div>
      {result.errors.length > 0 ? <div role="alert">{result.errors.map(error => <p key={error}>{error}</p>)}</div> : (
        <div>
          <p role="status">{result.changes.length ? `${result.changes.length}${result.truncated ? "+" : ""} differences` : "Documents are equivalent"}</p>
          {result.truncated && <p role="status">Results truncated: only the first 500 changes are displayed.</p>}
          <ol className="max-h-[460px] overflow-auto space-y-3">
            {result.changes.map((change, i) => <li key={i} className="border border-[var(--hairline)] rounded p-3 bg-[var(--bg-soft)] text-[var(--fg)]">
              <strong className={change.type === "Added" ? "text-[var(--cyan)]" : change.type === "Removed" ? "text-[var(--rose)]" : "text-[var(--amber)]"}>{change.type}</strong> <code className="break-all">{change.path}</code>
              {change.before !== undefined && <div>Before: <pre className="whitespace-pre-wrap break-all">{change.before}</pre></div>}
              {change.after !== undefined && <div>After: <pre className="whitespace-pre-wrap break-all">{change.after}</pre></div>}
            </li>)}
          </ol>
        </div>
      )}
    </section>
  );
}
