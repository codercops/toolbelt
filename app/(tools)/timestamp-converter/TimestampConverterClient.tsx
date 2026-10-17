"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyButton } from "@/components/shared/CopyButton";
import { formatTimestamp, relativeTime } from "@/lib/jwt-utils";
import { detectUnit, fromEpoch, toEpoch, type TimestampUnit } from "@/lib/time-utils";

const UNIT_OPTIONS: { value: TimestampUnit; label: string }[] = [
  { value: "s", label: "Seconds" },
  { value: "ms", label: "Milliseconds" },
  { value: "us", label: "Microseconds" },
  { value: "ns", label: "Nanoseconds" },
];

function Field({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--fg-muted)]">{label}</span>
        {copyValue !== undefined && <CopyButton value={copyValue} label={`Copy ${label}`} iconOnly />}
      </div>
      <p className="break-all font-mono text-sm text-[var(--fg)]">{value || "—"}</p>
    </div>
  );
}

export function TimestampConverterClient() {
  const [now, setNow] = useState<number | null>(null);
  const [epochInput, setEpochInput] = useState("1700000000");
  const [unit, setUnit] = useState<"auto" | TimestampUnit>("auto");
  const [dateInput, setDateInput] = useState("2024-02-29T00:00:00Z");

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      setNow(Date.now());
    }, 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  const detectedUnit = useMemo(() => detectUnit(epochInput), [epochInput]);
  const epochResult = useMemo(
    () => fromEpoch(epochInput, unit === "auto" ? undefined : unit),
    [epochInput, unit],
  );
  const dateResult = useMemo(() => toEpoch(dateInput), [dateInput]);

  const liveSeconds = now === null ? "—" : Math.floor(now / 1000).toString();
  const liveMilliseconds = now === null ? "—" : now.toString();
  const liveIso = now === null ? "—" : new Date(now).toISOString();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-12 sm:px-6">
      <section className="rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--green)]">Live Unix time</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--fg)]">Current timestamp</h2>
          </div>
          <p className="text-xs text-[var(--fg-muted)]">Updates every second</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Seconds" value={liveSeconds} copyValue={liveSeconds} />
          <Field label="Milliseconds" value={liveMilliseconds} copyValue={liveMilliseconds} />
        </div>
        <div className="mt-3">
          <Field label="Current ISO 8601" value={liveIso} copyValue={liveIso} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-4 sm:p-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--green)]">Epoch to date</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--fg)]">Convert a timestamp</h2>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">Paste an epoch value. Unit detection is based on its magnitude.</p>
          </div>
          <label className="block text-sm font-medium text-[var(--fg)]" htmlFor="epoch-input">Unix timestamp</label>
          <input id="epoch-input" value={epochInput} onChange={(e) => setEpochInput(e.target.value)} inputMode="decimal" spellCheck={false} placeholder="e.g. 1700000000" className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--bg)] px-3 py-3 font-mono text-sm text-[var(--fg)] outline-none focus:border-[var(--green)]" />
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--fg)]" htmlFor="epoch-unit">Timestamp unit</label>
              <select id="epoch-unit" value={unit} onChange={(e) => setUnit(e.target.value as "auto" | TimestampUnit)} className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--bg)] px-3 py-3 text-sm text-[var(--fg)]">
                <option value="auto">Auto-detect ({UNIT_OPTIONS.find((option) => option.value === detectedUnit)?.label})</option>
                {UNIT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="button" onClick={() => { setEpochInput(""); }} className="w-full rounded-xl border border-[var(--hairline)] px-3 py-3 text-sm text-[var(--fg-muted)] transition hover:text-[var(--fg)]">Clear input</button>
            </div>
          </div>
          {!epochResult.ok ? (
            <p role="alert" className="rounded-xl border border-[var(--rose)]/30 bg-[var(--rose)]/5 p-3 text-sm text-[var(--rose)]">{epochResult.error}</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-[var(--fg-muted)]">Interpreted as {UNIT_OPTIONS.find((option) => option.value === epochResult.unitUsed)?.label}</p>
              <Field label="UTC" value={epochResult.utc} copyValue={epochResult.utc} />
              <Field label="Local time" value={now === null ? "—" : formatTimestamp(epochResult.milliseconds / 1000)} copyValue={now === null ? undefined : formatTimestamp(epochResult.milliseconds / 1000)} />
              <Field label="ISO 8601" value={epochResult.iso} copyValue={epochResult.iso} />
              <Field label="Relative time" value={now === null ? "—" : relativeTime(epochResult.milliseconds / 1000, now)} />
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-4 sm:p-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--green)]">Date to epoch</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--fg)]">Convert a date</h2>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">Enter an ISO 8601 timestamp or a date string recognized by your browser.</p>
          </div>
          <label className="block text-sm font-medium text-[var(--fg)]" htmlFor="date-input">Date or ISO 8601</label>
          <input id="date-input" value={dateInput} onChange={(e) => setDateInput(e.target.value)} spellCheck={false} placeholder="2024-02-29T00:00:00Z" className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--bg)] px-3 py-3 font-mono text-sm text-[var(--fg)] outline-none focus:border-[var(--green)]" />
          {!dateResult.ok ? (
            <p role="alert" className="rounded-xl border border-[var(--rose)]/30 bg-[var(--rose)]/5 p-3 text-sm text-[var(--rose)]">{dateResult.error}</p>
          ) : (
            <div className="space-y-3">
              <Field label="Unix seconds" value={String(dateResult.seconds)} copyValue={String(dateResult.seconds)} />
              <Field label="Unix milliseconds" value={String(dateResult.milliseconds)} copyValue={String(dateResult.milliseconds)} />
              <Field label="Normalized ISO 8601" value={new Date(dateResult.milliseconds).toISOString()} copyValue={new Date(dateResult.milliseconds).toISOString()} />
            </div>
          )}
          <p className="text-xs text-[var(--fg-muted)]">For reliable results, include a timezone such as Z or an explicit UTC offset.</p>
        </section>
      </div>
    </div>
  );
}
