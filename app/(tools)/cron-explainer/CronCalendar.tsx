"use client";

import { useMemo, useState } from "react";
import { CALENDAR_RUN_LIMIT, cronCalendarMonth, shiftCalendarMonth } from "@/lib/cron-calendar";
import { MONTH_NAMES, WEEKDAY_NAMES } from "@/lib/cron";
import { cn } from "@/lib/cn";

export function CronCalendar({ expression, utc, now }: { expression: string; utc: boolean; now: number }) {
  const today = new Date(now);
  const todayYear = utc ? today.getUTCFullYear() : today.getFullYear();
  const todayMonth = utc ? today.getUTCMonth() : today.getMonth();
  const todayDay = utc ? today.getUTCDate() : today.getDate();
  const [month, setMonth] = useState({ year: todayYear, month: todayMonth });
  const [selected, setSelected] = useState<number | null>(null);
  const calendar = useMemo(() => cronCalendarMonth(expression, month.year, month.month, utc), [expression, month, utc]);
  const zone = utc ? "UTC" : `Local (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
  if (!calendar) return null;
  const selection = calendar.days.find((day) => day.day === selected);
  const monthLabel = `${MONTH_NAMES[month.month]} ${month.year}`;

  function navigate(offset: number) {
    setMonth(shiftCalendarMonth(month.year, month.month, offset));
    setSelected(null);
  }

  return (
    <section aria-label="Schedule calendar" className="card p-4 sm:p-5 space-y-4 text-[var(--fg)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-medium" aria-live="polite">{monthLabel} — {zone}</h2>
        <div role="group" aria-label="Calendar navigation" className="flex flex-wrap gap-2">
          <button type="button" className="btn" aria-label="Previous month" disabled={month.year === 100 && month.month === 0} onClick={() => navigate(-1)}>Previous</button>
          <button type="button" className="btn" onClick={() => {
            const current = new Date();
            setMonth({ year: utc ? current.getUTCFullYear() : current.getFullYear(), month: utc ? current.getUTCMonth() : current.getMonth() });
            setSelected(utc ? current.getUTCDate() : current.getDate());
          }}>Today</button>
          <button type="button" className="btn" aria-label="Next month" disabled={month.year === 9999 && month.month === 11} onClick={() => navigate(1)}>Next</button>
        </div>
      </div>
      <p className="text-sm text-[var(--fg-muted)]">Dates marked with a dot have scheduled runs. Select a date to see its times. This view includes all dates in the displayed month.</p>
      <table className="w-full table-fixed text-center">
        <caption className="sr-only">Scheduled dates for {monthLabel}, {zone}</caption>
        <thead><tr>{WEEKDAY_NAMES.map((day) => <th key={day} scope="col" className="py-2 text-sm font-medium"><abbr title={day} className="no-underline">{day.slice(0, 3)}</abbr></th>)}</tr></thead>
        <tbody>{Array.from({ length: Math.ceil((calendar.firstWeekday + calendar.days.length) / 7) }, (_, week) => (
          <tr key={week}>{Array.from({ length: 7 }, (_, weekday) => {
            const day = calendar.days[week * 7 + weekday - calendar.firstWeekday];
            if (!day) return <td key={weekday} />;
            const hasRuns = day.runs.length > 0;
            const isToday = month.year === todayYear && month.month === todayMonth && day.day === todayDay;
            return <td key={weekday} className="p-0.5 sm:p-1"><button
              type="button"
              aria-label={`${day.day} ${monthLabel}, ${hasRuns ? "has scheduled runs" : "no scheduled runs"}`}
              aria-pressed={selected === day.day}
              aria-current={isToday ? "date" : undefined}
              onClick={() => setSelected(day.day)}
              className={cn("min-h-11 w-full rounded-lg border py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fg)]",
                hasRuns ? "border-[var(--fg-muted)] bg-[var(--bg-raise)] font-bold" : "border-transparent",
                selected === day.day && "ring-2 ring-[var(--fg)]")}
            >{day.day}<span aria-hidden="true" className="block h-2 leading-none">{hasRuns ? "•" : ""}</span></button></td>;
          })}</tr>
        ))}</tbody>
      </table>
      <div aria-live="polite" className="space-y-2">
        {selection ? <>
          <h3 className="font-medium">{selection.day} {monthLabel} — {zone}</h3>
          {selection.runs.length === 0 ? <p>No scheduled runs on this date.</p> : <>
            {selection.truncated && <p>Showing the first {CALENDAR_RUN_LIMIT} runs for this date. More runs are scheduled; the list is truncated.</p>}
            <ol aria-label="Selected date run times" className="max-h-64 overflow-y-auto space-y-1">
              {selection.runs.map((run) => <li key={run.getTime()}><time dateTime={run.toISOString()} className="font-mono text-sm">{new Intl.DateTimeFormat("en-GB", {
                hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: utc ? "UTC" : undefined, timeZoneName: "short",
              }).format(run)}</time></li>)}
            </ol>
          </>}
        </> : <p>Select a date to view its scheduled run times.</p>}
      </div>
    </section>
  );
}
