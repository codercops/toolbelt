
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

/**
 * V8 accepts days up to 31 in any month and rolls them into the next
 * month. When the input starts with YYYY-MM-DD, compare the typed day
 * to that month's length so impossible dates stay errors.
 */
function hasImpossibleCalendarDay(dateString: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1) return true;

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
