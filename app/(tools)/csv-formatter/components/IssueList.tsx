"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { CsvIssue } from "@/lib/csv-utils";

const DISPLAY_LIMIT = 6;

export function IssueList({ issues }: { issues: CsvIssue[] }) {
  if (issues.length === 0) {
    return (
      <p
        role="status"
        className="flex items-center gap-2 rounded-xl border border-[var(--green)]/30 bg-[var(--green)]/5 p-3 text-sm text-[var(--green)]"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        No problems found — every row matches the header.
      </p>
    );
  }

  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.length - errors;
  const shown = issues.slice(0, DISPLAY_LIMIT);
  const hidden = issues.length - shown.length;

  return (
    <div role="status" aria-live="polite" className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)] px-3 py-2">
        <h2 className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
          Validation
        </h2>
        <p className="font-mono text-[11px] text-[var(--fg-muted)]">
          {errors > 0 && (
            <span className="text-[var(--rose)]">
              {errors} error{errors === 1 ? "" : "s"}
            </span>
          )}
          {errors > 0 && warnings > 0 && <span aria-hidden="true"> · </span>}
          {warnings > 0 && (
            <span className="text-[var(--amber)]">
              {warnings} warning{warnings === 1 ? "" : "s"}
            </span>
          )}
        </p>
      </div>
      <ul className="divide-y divide-[var(--hairline)]">
        {shown.map((issue, index) => (
          <li key={`${issue.code}-${issue.line}-${index}`} className="flex items-start gap-2.5 p-3 text-sm">
            {issue.severity === "error" ? (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rose)]" aria-hidden="true" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--amber)]" aria-hidden="true" />
            )}
            <span className="text-[var(--fg-muted)]">
              <span className="sr-only">{issue.severity === "error" ? "Error: " : "Warning: "}</span>
              <span className="font-mono text-[11px] text-[var(--fg-dim)]">line {issue.line}</span>
              <span aria-hidden="true"> — </span>
              <span className="text-[var(--fg)]">{issue.message}</span>
            </span>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <p className="border-t border-[var(--hairline)] px-3 py-2 text-[12.5px] text-[var(--fg-muted)]">
          …and {hidden} more {hidden === 1 ? "issue" : "issues"}.
        </p>
      )}
    </div>
  );
}
