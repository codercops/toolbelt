import { parseCron, runsOnCronDay } from "./cron";

export const CALENDAR_RUN_LIMIT = 50;
export interface CronCalendarDay {
  day: number;
  runs: Date[];
  truncated: boolean;
}

/** Zero-based month navigation, including year boundaries. */
export function shiftCalendarMonth(year: number, month: number, offset: number) {
  const date = new Date(Date.UTC(year, month + offset, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

/** Full calendar month, including past dates, with bounded work and storage per day.
 * Uses the scheduler's day matcher and DST behavior, rather than a separate cron implementation.
 */
export function cronCalendarMonth(expression: string, year: number, month: number, utc = true) {
  const parsed = parseCron(expression);
  if (!parsed.ok || !Number.isInteger(year) || year < 100 || year > 9999 ||
      !Number.isInteger(month) || month < 0 || month > 11) return null;
  const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const days: CronCalendarDay[] = [];
  for (let day = 1; day <= length; day++) {
    const runs: Date[] = [];
    let truncated = false;
    for (const run of runsOnCronDay(parsed.value, year, month, day, utc)) {
      if (runs.length === CALENDAR_RUN_LIMIT) {
        truncated = true;
        break;
      }
      runs.push(run);
    }
    days.push({ day, runs, truncated });
  }
  return { year, month, firstWeekday: new Date(Date.UTC(year, month, 1)).getUTCDay(), days };
}
