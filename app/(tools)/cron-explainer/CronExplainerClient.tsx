"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyButton } from "@/components/shared/CopyButton";
import {
  describeCron,
  describeField,
  nextRuns,
  noRunsMessage,
  parseCron,
  type CronField,
} from "@/lib/cron";

const RUN_COUNT = 5;

const PRESETS = [
  { label: "Every minute", expression: "* * * * *" },
  { label: "Every 15 minutes", expression: "*/15 * * * *" },
  { label: "Hourly", expression: "0 * * * *" },
  { label: "Daily at midnight", expression: "0 0 * * *" },
  { label: "Weekdays at 09:00", expression: "0 9 * * 1-5" },
  { label: "Every Monday", expression: "0 9 * * 1" },
  { label: "First of the month", expression: "0 0 1 * *" },
  { label: "@yearly", expression: "@yearly" },
];

const FIELD_LABELS = {
  minute: "Minute",
  hour: "Hour",
  dayOfMonth: "Day of month",
  month: "Month",
  dayOfWeek: "Day of week",
} as const;

const labelClass = "mb-1 block text-sm font-medium text-[var(--fg)]";
const inputClass =
  "w-full rounded-xl border border-[var(--hairline)] bg-[var(--bg)] px-3 py-2.5 font-mono text-base text-[var(--fg)]";

function formatRun(date: Date, utc: boolean): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: utc ? "UTC" : undefined,
    timeZoneName: "short",
  }).format(date);
}

export function CronExplainerClient() {
  const [expression, setExpression] = useState("0 9 * * 1-5");
  const [utc, setUtc] = useState(true);
  // The current time is only read in the browser, so the server and the first render agree.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setNow(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const parsed = useMemo(() => parseCron(expression), [expression]);
  const runs = useMemo(() => {
    if (!parsed.ok || now === null) return null;
    return nextRuns(parsed.value, new Date(now), RUN_COUNT, { utc });
  }, [parsed, now, utc]);

  function choose(next: string) {
    setExpression(next);
    setNow(Date.now());
  }

  const fields: CronField[] = parsed.ok
    ? [
        parsed.value.minute,
        parsed.value.hour,
        parsed.value.dayOfMonth,
        parsed.value.month,
        parsed.value.dayOfWeek,
      ]
    : [];
  const description = parsed.ok ? describeCron(parsed.value) : "";
  const eitherDay = parsed.ok && !parsed.value.dayOfMonth.star && !parsed.value.dayOfWeek.star;

  return (
    <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10 space-y-4">
      <div className="card p-4 sm:p-5 space-y-4">
        <div>
          <label htmlFor="cron-expression" className={labelClass}>Cron expression</label>
          <input
            id="cron-expression"
            type="text"
            value={expression}
            onChange={(event) => choose(event.target.value)}
            placeholder="*/15 * * * *"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={!parsed.ok && expression.trim() !== ""}
            aria-describedby="cron-hint"
            className={inputClass}
          />
          <p id="cron-hint" className="mt-1.5 text-[12.5px] font-mono text-[var(--fg-muted)]">
            minute hour day-of-month month day-of-week, or a macro such as @daily
          </p>
        </div>

        <div role="group" aria-label="Examples" className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.expression}
              type="button"
              className="btn"
              aria-pressed={expression.trim() === preset.expression}
              onClick={() => choose(preset.expression)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {!parsed.ok && expression.trim() !== "" && (
          <p role="alert" className="rounded-xl border border-[var(--rose)]/30 bg-[var(--rose)]/5 p-3 text-sm text-[var(--rose)]">
            {parsed.error}
          </p>
        )}
      </div>

      {parsed.ok && (
        <>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--hairline)] bg-[var(--bg-raise)] px-3 py-2">
              <h2 className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                In plain English
              </h2>
              <CopyButton value={description} label="Copy" successMessage="Description copied" className="py-1" />
            </div>
            <div className="p-4 sm:p-5 space-y-2">
              <p className="text-xl sm:text-2xl font-medium text-[var(--fg)]">{description}</p>
              {parsed.value.macro && (
                <p className="text-sm text-[var(--fg-muted)]">
                  <code className="font-mono">{parsed.value.macro}</code> is the same as{" "}
                  <code className="font-mono">{fields.map((field) => field.raw).join(" ")}</code>.
                </p>
              )}
              {eitherDay && (
                <p className="text-sm text-[var(--fg-muted)]">
                  Both the day of month and the day of week are set, so cron runs on the days that match
                  either one.
                </p>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-[var(--hairline)] bg-[var(--bg-raise)] px-3 py-2">
              <h2 className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                Field by field
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">What each field of the cron expression means</caption>
                <thead>
                  <tr className="text-[var(--fg-muted)]">
                    <th scope="col" className="px-3 py-2 font-medium">Field</th>
                    <th scope="col" className="px-3 py-2 font-medium">Value</th>
                    <th scope="col" className="px-3 py-2 font-medium">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline)]">
                  {fields.map((field) => (
                    <tr key={field.name}>
                      <th scope="row" className="px-3 py-2.5 font-medium text-[var(--fg)]">{FIELD_LABELS[field.name]}</th>
                      <td className="px-3 py-2.5"><code className="font-mono text-[var(--fg)]">{field.raw}</code></td>
                      <td className="px-3 py-2.5 text-[var(--fg-muted)]">{describeField(field)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] bg-[var(--bg-raise)] px-3 py-2">
              <h2 className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                Next {RUN_COUNT} runs
              </h2>
              <div className="segmented" role="group" aria-label="Time zone">
                {([["UTC", true], ["Local", false]] as const).map(([label, value]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={utc === value}
                    data-active={utc === value}
                    onClick={() => {
                      setUtc(value);
                      setNow(Date.now());
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {runs === null && <p className="p-4 text-sm text-[var(--fg-muted)]">Working out the next runs...</p>}
            {runs !== null && runs.length === 0 && (
              <p role="status" className="p-4 text-sm text-[var(--fg-muted)]">{noRunsMessage(parsed.value)}</p>
            )}
            {runs !== null && runs.length > 0 && (
              <ol aria-label="Next runs" className="divide-y divide-[var(--hairline)]">
                {runs.map((run) => (
                  <li key={run.getTime()} className="flex items-center justify-between gap-3 p-3">
                    <time dateTime={run.toISOString()} className="font-mono text-sm text-[var(--fg)]">
                      {formatRun(run, utc)}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </section>
  );
}
