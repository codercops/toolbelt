import { describe, expect, it, vi } from "vitest";
import { CALENDAR_RUN_LIMIT, cronCalendarMonth, shiftCalendarMonth } from "../cron-calendar";
import { nextRuns, parseCron } from "../cron";

function month(expression: string, year = 2024, index = 1, utc = true) {
  const result = cronCalendarMonth(expression, year, index, utc);
  if (!result) throw new Error("Expected valid calendar");
  return result;
}
const highlighted = (expression: string) => month(expression).days.filter((day) => day.runs.length).map((day) => day.day);

describe("cronCalendarMonth", () => {
  it("highlights every date for a daily schedule, including leap day", () => {
    expect(highlighted("0 9 * * *")).toEqual(Array.from({ length: 29 }, (_, i) => i + 1));
  });
  it("highlights weekdays, weekly runs, and monthly runs", () => {
    expect(highlighted("0 9 * * 1-5")).toEqual([1, 2, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 26, 27, 28, 29]);
    expect(highlighted("0 9 * * MON")).toEqual([5, 12, 19, 26]);
    expect(highlighted("@monthly")).toEqual([1]);
  });
  it("uses OR for two restricted day fields and AND for wildcard day fields", () => {
    expect(highlighted("0 0 1 * MON")).toEqual([1, 5, 12, 19, 26]);
    expect(highlighted("0 0 */2 * MON")).toEqual([5, 19]);
  });
  it("respects month restrictions and impossible dates", () => {
    expect(highlighted("0 0 31 2 *")).toEqual([]);
    expect(highlighted("0 0 * JAN *")).toEqual([]);
  });
  it.each([[2023, 1, 28], [2024, 1, 29], [2100, 1, 28], [2000, 1, 29], [2024, 3, 30], [2024, 11, 31]])("handles %i/%i month length", (year, index, length) => {
    expect(month("@daily", year, index).days).toHaveLength(length);
  });
  it("navigates months without overflowing short months or year boundaries", () => {
    expect(shiftCalendarMonth(2024, 0, 1)).toEqual({ year: 2024, month: 1 });
    expect(shiftCalendarMonth(2024, 11, 1)).toEqual({ year: 2025, month: 0 });
    expect(shiftCalendarMonth(2024, 0, -1)).toEqual({ year: 2023, month: 11 });
  });
  it("caps frequent schedules on every date and signals truncation", () => {
    const result = month("* * * * *");
    expect(result.days.every((day) => day.runs.length === CALENDAR_RUN_LIMIT && day.truncated)).toBe(true);
    expect(result.days[0].runs[0].toISOString()).toBe("2024-02-01T00:00:00.000Z");
    expect(result.days[0].runs.at(-1)?.toISOString()).toBe("2024-02-01T00:49:00.000Z");
  });
  it("does not signal truncation when all runs fit", () => {
    expect(month("0 * * * *").days.every((day) => day.runs.length === 24 && !day.truncated)).toBe(true);
    expect(month("0-49 0 * * *").days.every((day) => day.runs.length === 50 && !day.truncated)).toBe(true);
  });
  it("uses the scheduler's local DST rules", () => {
    vi.stubEnv("TZ", "America/New_York");
    try {
      const skipped = month("30 2 * * *", 2024, 2, false);
      expect(skipped.days[9].runs).toEqual([]);
      expect(skipped.days[8].runs[0].getHours()).toBe(2);
      expect(skipped.days[10].runs[0].getHours()).toBe(2);
      expect(month("30 2 * * *", 2024, 2, true).days[9].runs).toHaveLength(1);
      const folded = month("30 1 * * *", 2024, 10, false);
      // Like nextRuns, a repeated local wall time is represented once.
      expect(folded.days[2].runs).toHaveLength(1);
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it.each([true, false])("agrees with nextRuns in UTC/local mode (%s)", (utc) => {
    const expression = "15 9 * * MON";
    const parsed = parseCron(expression);
    if (!parsed.ok) throw new Error("Invalid expression");
    const from = utc ? new Date("2024-02-01T00:00:00Z") : new Date(2024, 1, 1);
    const runs = month(expression, 2024, 1, utc).days.flatMap((day) => day.runs);
    expect(runs).toEqual(nextRuns(parsed.value, from, runs.length, { utc }));
    expect(runs.every((run) => (utc ? run.getUTCHours() : run.getHours()) === 9)).toBe(true);
  });
  it("rejects invalid expressions and month requests", () => {
    expect(cronCalendarMonth("bad", 2024, 1)).toBeNull();
    expect(cronCalendarMonth("@daily", 2024, 12)).toBeNull();
    expect(cronCalendarMonth("@daily", NaN, 1)).toBeNull();
  });
});
