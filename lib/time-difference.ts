export type InstantFormat = "s" | "ms" | "iso";
export type InstantInput = { value: string; format: InstantFormat };
type ParsedInstant = { ok: true; milliseconds: bigint } | { ok: false; error: string };
const MAX_DATE_MS = BigInt("8640000000000000");
const ZERO = BigInt(0);
const THOUSAND = BigInt(1000);

/** Parse explicit instants at millisecond precision, never in the browser's local timezone. */
export function parseInstant({ value, format }: InstantInput): ParsedInstant {
  const input = value.trim();
  if (!input) return { ok: false, error: "Enter a timestamp or ISO 8601 date." };
  let milliseconds: bigint;
  if (format !== "iso") {
    const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(input);
    if (!match || (match[3]?.length ?? 0) > (format === "s" ? 3 : 0)) {
      return { ok: false, error: format === "s" ? "Enter seconds with at most three decimal places." : "Enter a whole number of milliseconds." };
    }
    milliseconds = BigInt(match[2]) * (format === "s" ? THOUSAND : BigInt(1));
    if (format === "s") milliseconds += BigInt((match[3] ?? "").padEnd(3, "0"));
    if (match[1] === "-") milliseconds = -milliseconds;
  } else {
    const match = /^(\d{4}|[+-]\d{6})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/.exec(input);
    if (!match) return { ok: false, error: "Enter ISO 8601 with Z or an offset (e.g. +05:30), at millisecond precision." };
    const [, year, month, day, hour, minute, second, , zone] = match;
    const y = Number(year), m = Number(month), d = Number(day);
    const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (m < 1 || m > 12 || d < 1 || d > days[m - 1] || Number(hour) > 23 || Number(minute) > 59 || Number(second ?? 0) > 59 ||
      (zone !== "Z" && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59))) {
      return { ok: false, error: "Enter a valid ISO 8601 date, time, and timezone offset." };
    }
    const parsed = Date.parse(input);
    if (!Number.isFinite(parsed)) return { ok: false, error: "Date is outside the supported range." };
    milliseconds = BigInt(parsed);
  }
  if (milliseconds < -MAX_DATE_MS || milliseconds > MAX_DATE_MS) return { ok: false, error: "Date is outside the supported range." };
  return { ok: true, milliseconds };
}

export function calculateTimeDifference(start: InstantInput, end: InstantInput) {
  const from = parseInstant(start), to = parseInstant(end);
  if (!from.ok || !to.ok) return { ok: false, startError: from.ok ? undefined : from.error, endError: to.ok ? undefined : to.error } as const;
  const difference = to.milliseconds - from.milliseconds;
  const absolute = difference < ZERO ? -difference : difference;
  const fraction = (absolute % THOUSAND).toString().padStart(3, "0").replace(/0+$/, "");
  return {
    ok: true,
    milliseconds: difference.toString(),
    seconds: `${difference < ZERO ? "-" : ""}${absolute / THOUSAND}${fraction ? `.${fraction}` : ""}`,
    earlier: difference < ZERO,
    duration: `${absolute / BigInt(86400000)} days, ${(absolute / BigInt(3600000)) % BigInt(24)} hours, ${(absolute / BigInt(60000)) % BigInt(60)} minutes, ${(absolute / THOUSAND) % BigInt(60)} seconds, ${absolute % THOUSAND} milliseconds`,
  } as const;
}
