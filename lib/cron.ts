// Pure logic for the Cron Expression Explainer: no React, no DOM, no dependencies.
// Standard 5-field cron: minute hour day-of-month month day-of-week.

export type CronFieldName = "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";

export interface CronField {
  name: CronFieldName;
  /** The field as written, such as `*\/15` or `MON-FRI`. */
  raw: string;
  /** Every value the field allows, sorted, without duplicates. Day of week 7 is stored as 0. */
  values: number[];
  /** True when the field starts with `*`. Cron treats such a day field as unrestricted. */
  star: boolean;
}

export interface ParsedCron {
  /** What was typed, trimmed and with single spaces. */
  expression: string;
  /** The macro it came from, such as `@daily`, if any. */
  macro?: string;
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
}

export type CronParseResult =
  | { ok: true; value: ParsedCron }
  | { ok: false; error: string; field?: CronFieldName };

interface FieldSpec {
  name: CronFieldName;
  label: string;
  min: number;
  max: number;
  names?: Record<string, number>;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MONTH_ABBREVIATIONS: Record<string, number> = Object.fromEntries(
  MONTH_NAMES.map((name, index) => [name.slice(0, 3).toUpperCase(), index + 1]),
);
const WEEKDAY_ABBREVIATIONS: Record<string, number> = Object.fromEntries(
  WEEKDAY_NAMES.map((name, index) => [name.slice(0, 3).toUpperCase(), index]),
);

export const FIELD_SPECS: FieldSpec[] = [
  { name: "minute", label: "minute", min: 0, max: 59 },
  { name: "hour", label: "hour", min: 0, max: 23 },
  { name: "dayOfMonth", label: "day of month", min: 1, max: 31 },
  { name: "month", label: "month", min: 1, max: 12, names: MONTH_ABBREVIATIONS },
  { name: "dayOfWeek", label: "day of week", min: 0, max: 7, names: WEEKDAY_ABBREVIATIONS },
];

const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

type FieldResult = { ok: true; field: CronField } | { ok: false; error: string };

function parseValue(text: string, spec: FieldSpec): number | null {
  if (/^\d+$/.test(text)) return Number(text);
  const named = spec.names?.[text.toUpperCase()];
  return named === undefined ? null : named;
}

function parseField(raw: string, spec: FieldSpec): FieldResult {
  const fail = (message: string): FieldResult => ({ ok: false, error: `Invalid ${spec.label} field: ${message}` });
  const range = `${spec.min} to ${spec.max}`;
  const found = new Set<number>();

  for (const item of raw.split(",")) {
    if (item === "") return fail(`"${raw}" has an empty entry`);

    const pieces = item.split("/");
    if (pieces.length > 2) return fail(`"${item}" has more than one step`);
    const [rangeText, stepText] = pieces;

    let step = 1;
    if (stepText !== undefined) {
      if (!/^\d+$/.test(stepText) || Number(stepText) < 1) {
        return fail(`the step "${stepText}" must be a whole number of 1 or more`);
      }
      step = Number(stepText);
    }

    let start: number;
    let end: number;
    if (rangeText === "*") {
      start = spec.min;
      // Day of week 7 is Sunday again, so a wildcard stops at Saturday.
      end = spec.name === "dayOfWeek" ? 6 : spec.max;
    } else if (rangeText.includes("-")) {
      const [from, to, ...rest] = rangeText.split("-");
      const low = parseValue(from, spec);
      const high = parseValue(to ?? "", spec);
      if (rest.length > 0 || low === null || high === null) {
        return fail(`"${rangeText}" is not a valid range`);
      }
      if (low < spec.min || low > spec.max) return fail(`${low} is not in the range ${range}`);
      if (high < spec.min || high > spec.max) return fail(`${high} is not in the range ${range}`);
      if (low > high) return fail(`the range "${rangeText}" ends before it starts`);
      start = low;
      end = high;
    } else {
      const value = parseValue(rangeText, spec);
      if (value === null) return fail(`"${rangeText}" is not a valid value`);
      if (value < spec.min || value > spec.max) return fail(`${value} is not in the range ${range}`);
      if (stepText !== undefined) {
        return fail(`a step needs * or a range in front of it, such as ${value}-${spec.max}/${step}`);
      }
      start = value;
      end = value;
    }

    for (let value = start; value <= end; value += step) {
      found.add(spec.name === "dayOfWeek" && value === 7 ? 0 : value);
    }
  }

  const values = [...found].sort((a, b) => a - b);
  return { ok: true, field: { name: spec.name, raw, values, star: raw.startsWith("*") } };
}

/** Reads a 5-field cron expression or a macro such as `@daily`. */
export function parseCron(input: string): CronParseResult {
  const expression = input.trim().replace(/\s+/g, " ");
  if (!expression) return { ok: false, error: "Enter a cron expression." };

  let macro: string | undefined;
  let source = expression;
  if (expression.startsWith("@")) {
    macro = expression.toLowerCase();
    if (macro === "@reboot") {
      return { ok: false, error: "@reboot runs once at startup, so it has no schedule to explain." };
    }
    const expanded = MACROS[macro];
    if (!expanded) {
      return { ok: false, error: `Unknown macro "${expression}". Use @hourly, @daily, @weekly, @monthly or @yearly.` };
    }
    source = expanded;
  }

  const parts = source.split(" ");
  if (parts.length !== FIELD_SPECS.length) {
    const extra =
      parts.length > FIELD_SPECS.length
        ? " Seconds and year fields (Quartz style) are not supported."
        : "";
    return {
      ok: false,
      error: `Expected 5 fields (minute, hour, day of month, month, day of week) but found ${parts.length}.${extra}`,
    };
  }

  const fields = {} as Record<CronFieldName, CronField>;
  for (const [index, spec] of FIELD_SPECS.entries()) {
    const result = parseField(parts[index], spec);
    if (!result.ok) return { ok: false, error: result.error, field: spec.name };
    fields[spec.name] = result.field;
  }

  return { ok: true, value: { expression, macro, ...fields } };
}

// ---------- Describing ----------

const pad = (n: number) => String(n).padStart(2, "0");
/** Days of the week as 1 (Monday) to 7 (Sunday), so a week reads Monday first. */
const mondayFirst = (days: number[]) => days.map((day) => (day === 0 ? 7 : day)).sort((a, b) => a - b);
const weekdayName = (day: number) => WEEKDAY_NAMES[day % 7];
const isAll = (field: CronField, spec: FieldSpec) =>
  field.values.length === (spec.name === "dayOfWeek" ? 7 : spec.max - spec.min + 1);
const specOf = (name: CronFieldName) => FIELD_SPECS.find((spec) => spec.name === name)!;

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** "1, 2, 3, 5" becomes "1 through 3 and 5": runs of three or more are shortened. */
function listValues(values: number[], format: (value: number) => string): string {
  const parts: string[] = [];
  let i = 0;
  while (i < values.length) {
    let j = i;
    while (j + 1 < values.length && values[j + 1] === values[j] + 1) j += 1;
    if (j - i >= 2) {
      parts.push(`${format(values[i])} through ${format(values[j])}`);
    } else {
      for (let k = i; k <= j; k += 1) parts.push(format(values[k]));
    }
    i = j + 1;
  }
  return joinList(parts);
}

/** The step of values that repeat evenly through the range, like 0, 15, 30, 45. Otherwise null. */
function evenStep(values: number[], cycle: number): number | null {
  if (values.length < 2 || values[0] !== 0) return null;
  const step = values[1] - values[0];
  if (cycle % step !== 0 || values.length !== cycle / step) return null;
  return values.every((value, index) => value === index * step) ? step : null;
}

function isRun(values: number[]): boolean {
  return values.length > 1 && values.every((value, index) => index === 0 || value === values[index - 1] + 1);
}

function describeTime(cron: ParsedCron): string {
  const minutes = cron.minute.values;
  const hours = cron.hour.values;
  const everyMinute = isAll(cron.minute, specOf("minute"));
  const everyHour = isAll(cron.hour, specOf("hour"));
  const minuteStep = everyMinute ? 1 : evenStep(minutes, 60);

  // A readable range of hours: "from 09:00 through 17:59" for minutes, "17:00" for a single minute.
  const hourRange = (endMinute: number) =>
    hours.length === 1
      ? `from ${pad(hours[0])}:00 through ${pad(hours[0])}:${pad(endMinute)}`
      : `from ${pad(hours[0])}:00 through ${pad(hours[hours.length - 1])}:${pad(endMinute)}`;

  if (everyHour) {
    if (everyMinute) return "Every minute";
    if (minuteStep) return `Every ${minuteStep} minutes`;
    if (minutes.length === 1) return minutes[0] === 0 ? "Every hour, on the hour" : `At minute ${minutes[0]} past every hour`;
    return `At minutes ${listValues(minutes, String)} past every hour`;
  }

  // Specific hours.
  if (minuteStep) {
    const every = minuteStep === 1 ? "Every minute" : `Every ${minuteStep} minutes`;
    if (hours.length === 1 || isRun(hours)) return `${every}, ${hourRange(59)}`;
    return `${every}, during hours ${listValues(hours, String)}`;
  }

  const times = hours.length * minutes.length;
  if (times <= 6) {
    return `At ${joinList(hours.flatMap((hour) => minutes.map((minute) => `${pad(hour)}:${pad(minute)}`)))}`;
  }

  const hourStep = evenStep(hours, 24);
  if (minutes.length === 1 && hourStep) {
    return minutes[0] === 0 ? `Every ${hourStep} hours` : `Every ${hourStep} hours, at minute ${minutes[0]}`;
  }
  if (minutes.length === 1 && isRun(hours)) {
    const start = minutes[0] === 0 ? "Every hour, on the hour" : `At minute ${minutes[0]} past every hour`;
    return `${start}, from ${pad(hours[0])}:00 through ${pad(hours[hours.length - 1])}:${pad(minutes[0])}`;
  }
  return `At minute${minutes.length > 1 ? "s" : ""} ${listValues(minutes, String)} past hours ${listValues(hours, String)}`;
}

function describeDays(cron: ParsedCron): string {
  const phrases: string[] = [];

  // The same rule as nextRuns: when neither field starts with *, a day matches if either one
  // does, so a field that covers every value makes every day match. Otherwise both must match.
  const either = !cron.dayOfMonth.star && !cron.dayOfWeek.star;
  const domAll = isAll(cron.dayOfMonth, specOf("dayOfMonth"));
  const dowAll = isAll(cron.dayOfWeek, specOf("dayOfWeek"));
  const domRestricted = !domAll && !(either && dowAll);
  const dowRestricted = !dowAll && !(either && domAll);

  const dom = domRestricted
    ? `on day${cron.dayOfMonth.values.length > 1 ? "s" : ""} ${listValues(cron.dayOfMonth.values, String)} of the month`
    : "";

  let dow = "";
  if (dowRestricted) {
    const days = mondayFirst(cron.dayOfWeek.values);
    if (days.join() === "1,2,3,4,5") dow = "on weekdays";
    else if (days.join() === "6,7") dow = "on weekends";
    else dow = `on ${listValues(days, weekdayName)}`;
  }

  if (dom && dow) phrases.push(either ? `${dom} and ${dow}` : `${dom}, but only ${dow}`);
  else if (dom || dow) phrases.push(dom || dow);

  if (!isAll(cron.month, specOf("month"))) {
    phrases.push(`in ${listValues(cron.month.values, (month) => MONTH_NAMES[month - 1])}`);
  }
  return phrases.join(" ");
}

/** A plain-English sentence for the schedule, such as "At 09:00 on weekdays". */
export function describeCron(cron: ParsedCron): string {
  const time = describeTime(cron);
  const days = describeDays(cron);
  if (days) return `${time} ${days}`;
  // A fixed time of day with no day restrictions reads better with "every day".
  return time.startsWith("At ") && !time.includes("past") ? `${time} every day` : time;
}

/** The meaning of one field for the breakdown table, such as "every 15 minutes (0, 15, 30, 45)". */
export function describeField(field: CronField): string {
  const spec = specOf(field.name);
  if (isAll(field, spec)) {
    return { minute: "every minute", hour: "every hour", dayOfMonth: "every day of the month", month: "every month", dayOfWeek: "every day of the week" }[field.name];
  }
  const format =
    field.name === "month"
      ? (value: number) => MONTH_NAMES[value - 1]
      : field.name === "dayOfWeek"
        ? weekdayName
        : field.name === "hour"
          ? (value: number) => `${pad(value)}:00`
          : String;
  const list = listValues(field.name === "dayOfWeek" ? mondayFirst(field.values) : field.values, format);
  if (field.name === "minute") {
    const step = evenStep(field.values, 60);
    if (step) return `every ${step} minutes (${field.values.join(", ")})`;
    return `minute${field.values.length > 1 ? "s" : ""} ${list}`;
  }
  if (field.name === "hour") {
    const step = evenStep(field.values, 24);
    if (step) return `every ${step} hours (${list})`;
    return `hour${field.values.length > 1 ? "s" : ""} ${list}`;
  }
  if (field.name === "dayOfMonth") return `day${field.values.length > 1 ? "s" : ""} ${list}`;
  return list;
}

// ---------- Next runs ----------

const MAX_RUNS = 100;
/** About ten years: long enough for February 29, short enough to stop an impossible schedule. */
const SEARCH_DAYS = 3660;

const MAX_DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** False when no allowed day-of-month exists in any allowed month, like `0 0 31 2 *`. */
function canEverRun(cron: ParsedCron): boolean {
  const domUsed = !cron.dayOfMonth.star;
  const dowUsed = !cron.dayOfWeek.star;
  // When both are restricted a day matches if either does, so a weekday always gives a run.
  if (!domUsed || dowUsed) return true;
  return cron.month.values.some((month) =>
    cron.dayOfMonth.values.some((day) => day <= MAX_DAYS_IN_MONTH[month - 1]),
  );
}

/** Why a schedule has no runs, for when `nextRuns` returns an empty list. */
export function noRunsMessage(cron: ParsedCron): string {
  if (!canEverRun(cron)) {
    const months = listValues(cron.month.values, (month) => MONTH_NAMES[month - 1]);
    const days = listValues(cron.dayOfMonth.values, String);
    return `This schedule never runs: ${months} ${cron.month.values.length > 1 ? "have" : "has"} no day ${days}.`;
  }
  return "No run was found in the next ten years.";
}

/**
 * The next `count` times the schedule fires after `from`, in UTC or in the local time zone.
 * Cron's rule for the day: when both day of month and day of week are restricted, a day
 * matches if either one does. Otherwise both must match (an unrestricted one always does).
 * Local times that do not exist (the hour skipped by daylight saving time) are left out.
 */
export function nextRuns(
  cron: ParsedCron,
  from: Date,
  count: number,
  { utc = true }: { utc?: boolean } = {},
): Date[] {
  const wanted = Math.min(Math.max(Math.floor(count), 0), MAX_RUNS);
  const runs: Date[] = [];
  if (wanted === 0 || !canEverRun(cron)) return runs;

  const domRestricted = !cron.dayOfMonth.star;
  const dowRestricted = !cron.dayOfWeek.star;
  const months = new Set(cron.month.values);
  const monthDays = new Set(cron.dayOfMonth.values);
  const weekdays = new Set(cron.dayOfWeek.values);

  // Walk the calendar one day at a time. The calendar itself is the same in every time
  // zone, so a UTC date is used to step through it.
  const startDay = utc
    ? Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
    : Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());

  for (let offset = 0; offset < SEARCH_DAYS && runs.length < wanted; offset += 1) {
    const day = new Date(startDay + offset * 86_400_000);
    const year = day.getUTCFullYear();
    const month = day.getUTCMonth();
    const date = day.getUTCDate();

    if (!months.has(month + 1)) continue;
    const domMatch = monthDays.has(date);
    const dowMatch = weekdays.has(day.getUTCDay());
    const dayMatches = domRestricted && dowRestricted ? domMatch || dowMatch : domMatch && dowMatch;
    if (!dayMatches) continue;

    for (const hour of cron.hour.values) {
      for (const minute of cron.minute.values) {
        const candidate = utc ? new Date(Date.UTC(year, month, date, hour, minute)) : new Date(year, month, date, hour, minute);
        if (!utc && (candidate.getHours() !== hour || candidate.getDate() !== date)) continue;
        if (candidate.getTime() > from.getTime()) {
          runs.push(candidate);
          if (runs.length === wanted) return runs;
        }
      }
    }
  }
  return runs;
}
