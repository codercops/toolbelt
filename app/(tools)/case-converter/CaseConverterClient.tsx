"use client";

import { useMemo, useState } from "react";
import { toCase, CASE_STYLES } from "@/lib/case-utils";
import { CopyButton } from "@/components/shared/CopyButton";

export function CaseConverterClient() {
  const [input, setInput] = useState("");

  // Pure conversion — derived from the input, no effect needed.
  const outputs = useMemo(
    () =>
      CASE_STYLES.map((style) => ({
        ...style,
        value: input ? toCase(input, style.id) : "",
      })),
    [input]
  );

  return (
    <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10 space-y-4">
      <div className="card overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
          <label
            htmlFor="case-input"
            className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]"
          >
            Input text
          </label>
          <span className="font-mono text-[10.5px] text-[var(--fg-dim)]">
            {input.length} chars
          </span>
        </div>
        <textarea
          id="case-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"user_id\nXMLHttpRequest\n  Hello   World "}
          spellCheck={false}
          className="editor-input flex-1 p-4"
          style={{ minHeight: 180 }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {outputs.map((o) => (
          <div key={o.id} className="card overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
              <span className="font-mono text-[10.5px] tracking-[0.22em] text-[var(--fg-dim)]">
                {o.label}
              </span>
              <CopyButton value={o.value} disabled={!o.value} className="py-1" />
            </div>
            <pre
              className="flex-1 p-4 font-mono text-[13px] leading-[1.7] whitespace-pre-wrap break-all overflow-auto text-[var(--fg)]"
              style={{ minHeight: 64 }}
            >
              {o.value || (
                <span className="text-[var(--fg-muted)]">
                  {input ? "—" : `${o.example}`}
                </span>
              )}
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}
