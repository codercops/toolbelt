"use client";

import { useState } from "react";
import { CopyButton } from "@/components/shared/CopyButton";
import { calculateTimeDifference, type InstantInput } from "@/lib/time-difference";

const inputClass = "w-full rounded-xl border border-[var(--hairline)] bg-[var(--bg)] px-3 py-3 text-sm text-[var(--fg)]";

export function TimeDifference() {
  const [start, setStart] = useState<InstantInput>({ value: "0", format: "s" });
  const [end, setEnd] = useState<InstantInput>({ value: "86400", format: "s" });
  const result = calculateTimeDifference(start, end);
  return (
    <section aria-labelledby="time-difference-heading" className="space-y-4 rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-4 sm:p-6">
      <h2 id="time-difference-heading" className="text-xl font-semibold text-[var(--fg)]">Time difference</h2>
      <p className="text-sm text-[var(--fg-muted)]">End minus start, at millisecond precision. ISO dates require Z or a timezone offset. One day means 24 hours of elapsed time.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {([
          { name: "Start", input: start, setInput: setStart, error: result.ok ? undefined : result.startError },
          { name: "End", input: end, setInput: setEnd, error: result.ok ? undefined : result.endError },
        ]).map(({ name, input, setInput, error }) => {
          const id = `difference-${name.toLowerCase()}`;
          return <div key={name} className="space-y-2">
            <label htmlFor={id} className="block text-sm font-medium text-[var(--fg)]">{name} time</label>
            <input id={id} value={input.value} onChange={(e) => setInput({ ...input, value: e.target.value })} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} spellCheck={false} className={`${inputClass} font-mono`} />
            <label htmlFor={`${id}-format`} className="block text-sm font-medium text-[var(--fg)]">{name} format</label>
            <select id={`${id}-format`} value={input.format} onChange={(e) => setInput({ ...input, format: e.target.value as InstantInput["format"] })} className={inputClass}>
              <option value="s">Unix seconds</option><option value="ms">Unix milliseconds</option><option value="iso">ISO 8601</option>
            </select>
            {error && <p id={`${id}-error`} role="alert" className="text-sm text-[var(--rose)]">{name}: {error}</p>}
          </div>;
        })}
      </div>
      <button type="button" className="btn" onClick={() => { setStart(end); setEnd(start); }}>Swap start and end</button>
      {result.ok && <div className="space-y-2 text-sm text-[var(--fg)]">
        <p>Signed difference: <span className="font-mono">{result.milliseconds} ms</span></p>
        <p>Signed seconds: <span className="font-mono">{result.seconds} s</span></p>
        <p>Absolute duration: {result.duration}</p>
        {result.earlier && <p className="text-[var(--fg-muted)]">The end time is earlier than the start time, so the signed difference is negative.</p>}
        <CopyButton label="Copy time difference" value={`${result.milliseconds} ms (${result.seconds} s)\nAbsolute duration: ${result.duration}`} />
      </div>}
    </section>
  );
}
