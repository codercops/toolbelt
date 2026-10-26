
export type TimestampUnit = "s" | "ms" | "us" | "ns";

export type EpochResult =
  | {
      ok: true;
      iso: string;
      utc: string;
      unitUsed: TimestampUnit;
      milliseconds: number;
    }
  | {
      ok: false;
      error: string;
    };

export type DateEpochResult =
  | { ok: true; seconds: number; milliseconds: number }
  | { ok: false; error: string };

const MAX_DATE_MS = 8.64e15;

function parseNumericValue(value: string | number): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Detect the likely epoch unit using the magnitude of the value.
 * Thresholds follow the issue's examples and also support microseconds
 * and nanoseconds.
 */
export function detectUnit(value: string | number): TimestampUnit {
  const parsed = parseNumericValue(value);
  if (parsed === null) return "s";

  const magnitude = Math.abs(parsed);

  if (magnitude < 1e11) return "s";
  if (magnitude < 1e14) return "ms";
  if (magnitude < 1e17) return "us";
  return "ns";
}

function unitToMilliseconds(value: number, unit: TimestampUnit): number {
  switch (unit) {
    case "s":
      return value * 1000;
    case "ms":
      return value;
    case "us":
      return value / 1000;
    case "ns":
      return value / 1_000_000;
  }
}

function formatUtc(date: Date): string {
  return date.toLocaleString("en-GB", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }) + " UTC";
}

export function fromEpoch(
  value: string | number,
  unit?: TimestampUnit
): EpochResult {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return { ok: false, error: "Enter a valid numeric timestamp." };
  }

  const unitUsed = unit ?? detectUnit(parsed);
  const milliseconds = unitToMilliseconds(parsed, unitUsed);

  if (!Number.isFinite(milliseconds) || Math.abs(milliseconds) > MAX_DATE_MS) {
    return { ok: false, error: "Timestamp is outside the supported date range." };
  }

  const date = new Date(milliseconds);

  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Timestamp is outside the supported date range." };
  }

  return {
    ok: true,
    iso: date.toISOString(),
    utc: formatUtc(date),
    unitUsed,
    milliseconds,
  };
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

type CalendarDay = { year: number | null; month: number; day: number };

function monthNumber(name: string): number | null {
  return MONTH_NAMES[name.toLowerCase().replace(/\.$/, "")] ?? null;
}

function extractCalendarDay(dateString: string): CalendarDay | null {
  const numeric = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?=\D|$)/.exec(
    dateString
  );
  if (numeric) {
    return {
      year: Number(numeric[1]),
      month: Number(numeric[2]),
      day: Number(numeric[3]),
    };
  }

  const monthFirstNumeric = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?!\d)/.exec(
    dateString
  );
  if (monthFirstNumeric) {
    return {
      year: Number(monthFirstNumeric[3]),
      month: Number(monthFirstNumeric[1]),
      day: Number(monthFirstNumeric[2]),
    };
  }

  const dayFirst =
    /(?:^|[^\w])(\d{1,2})(?:st|nd|rd|th)?[\s-]+([A-Za-z]{3,9})\.?,?\s+(\d{4})/i.exec(
      dateString
    );
  if (dayFirst) {
    const month = monthNumber(dayFirst[2]);
    if (month !== null) {
      return { year: Number(dayFirst[3]), month, day: Number(dayFirst[1]) };
    }
  }

  const yearFirst =
    /(?:^|[^\w])(\d{4})[-\s]+([A-Za-z]{3,9})\.?[-\s]+(\d{1,2})(?:st|nd|rd|th)?/i.exec(
      dateString
    );
  if (yearFirst) {
    const month = monthNumber(yearFirst[2]);
    if (month !== null) {
      return { year: Number(yearFirst[1]), month, day: Number(yearFirst[3]) };
    }
  }

  const monthFirst =
    /(?:^|[^\w])([A-Za-z]{3,9})\.?\s+(\d{1,2})(?!\d)(?:st|nd|rd|th)?,?(?:\s+(\d{4}))?/i.exec(
      dateString
    );
  if (monthFirst) {
    const month = monthNumber(monthFirst[1]);
    if (month !== null) {
      return {
        year: monthFirst[3] ? Number(monthFirst[3]) : null,
        month,
        day: Number(monthFirst[2]),
      };
    }
  }

  return null;
}

/**
 * V8 accepts days up to 31 in any month and rolls them into the next
 * month. Extract the typed calendar day from the supported formats and
 * compare it to that month's length so impossible dates stay errors.
 */
function hasImpossibleCalendarDay(dateString: string): boolean {
  const calendarDay = extractCalendarDay(dateString);
  if (!calendarDay) return false;

  const { year, month, day } = calendarDay;

  if (month < 1 || month > 12 || day < 1) return true;

  if (year === null) {
    const maxDay = month === 2 ? 29 : new Date(Date.UTC(2000, month, 0)).getUTCDate();
    return day > maxDay;
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day > daysInMonth;
}

export function toEpoch(dateString: string): DateEpochResult {
  const trimmed = dateString.trim();

  if (!trimmed) {
    return { ok: false, error: "Enter a date or ISO 8601 timestamp." };
  }

  if (hasImpossibleCalendarDay(trimmed)) {
    return { ok: false, error: "Enter a valid date or ISO 8601 timestamp." };
  }

  const milliseconds = Date.parse(trimmed);

  if (!Number.isFinite(milliseconds)) {
    return { ok: false, error: "Enter a valid date or ISO 8601 timestamp." };
  }

  const date = new Date(milliseconds);

  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Enter a valid date or ISO 8601 timestamp." };
  }

  return {
    ok: true,
    seconds: Math.floor(milliseconds / 1000),
    milliseconds,
  };
}
