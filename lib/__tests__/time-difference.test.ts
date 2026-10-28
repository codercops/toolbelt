import { describe, expect, it } from "vitest";
import { calculateTimeDifference, parseInstant, type InstantInput } from "@/lib/time-difference";

const instant = (value: string, format: InstantInput["format"] = "ms"): InstantInput => ({ value, format });

describe("time difference", () => {
  it("returns zero for equal instants including mixed units", () => {
    const result = calculateTimeDifference(instant("1700000000.123", "s"), instant("1700000000123"));
    expect(result).toMatchObject({ ok: true, milliseconds: "0", seconds: "0", duration: "0 days, 0 hours, 0 minutes, 0 seconds, 0 milliseconds" });
  });

  it("reverses signed differences and preserves absolute duration", () => {
    const forward = calculateTimeDifference(instant("0"), instant("90061002"));
    const backward = calculateTimeDifference(instant("90061002"), instant("0"));
    expect(forward).toMatchObject({ ok: true, milliseconds: "90061002", seconds: "90061.002", earlier: false });
    expect(backward).toMatchObject({ ok: true, milliseconds: "-90061002", seconds: "-90061.002", earlier: true });
    if (forward.ok && backward.ok) {
      expect(forward.duration).toBe("1 day, 1 hour, 1 minute, 1 second, 2 milliseconds");
      expect(backward.duration).toBe(forward.duration);
    }
  });

  it("compares different offsets representing the same instant", () => {
    expect(calculateTimeDifference(instant("2024-01-01T05:30:00+05:30", "iso"), instant("2024-01-01T00:00:00Z", "iso"))).toMatchObject({ ok: true, milliseconds: "0" });
  });

  it.each([
    ["2026-10-28T14:33:27.123456+00:00", "2026-10-28T14:33:27.123Z"],
    ["2026-10-28T14:33:27.123456789Z", "2026-10-28T14:33:27.123Z"],
    ["2026-10-28T20:03:27.999999999999999999+05:30", "2026-10-28T14:33:27.999Z"],
    ["1969-12-31T23:59:59.999999Z", "1969-12-31T23:59:59.999Z"],
    ["2026-10-28T14:33:27.1Z", "2026-10-28T14:33:27.100Z"],
  ])("truncates ISO fractions to milliseconds: %s", (start, end) => {
    expect(calculateTimeDifference(instant(start, "iso"), instant(end, "iso"))).toMatchObject({ ok: true, milliseconds: "0" });
  });

  it.each([
    ["86400000", "1 day, 0 hours, 0 minutes, 0 seconds, 0 milliseconds"],
    ["90061001", "1 day, 1 hour, 1 minute, 1 second, 1 millisecond"],
    ["180122002", "2 days, 2 hours, 2 minutes, 2 seconds, 2 milliseconds"],
  ])("pluralizes each duration component for %s ms", (value, duration) => {
    expect(calculateTimeDifference(instant("0"), instant(value))).toMatchObject({ ok: true, duration });
  });

  it.each([
    ["2024-03-10T01:30:00-05:00", "2024-03-10T03:30:00-04:00", "3600000"],
    ["2024-11-03T01:30:00-04:00", "2024-11-03T01:30:00-05:00", "3600000"],
    ["2024-03-10T00:00:00-05:00", "2024-03-11T00:00:00-04:00", "82800000"],
  ])("uses elapsed time across DST: %s to %s", (start, end, milliseconds) => {
    expect(calculateTimeDifference(instant(start, "iso"), instant(end, "iso"))).toMatchObject({ ok: true, milliseconds });
  });

  it("keeps differences at the date range boundaries exact", () => {
    expect(calculateTimeDifference(instant("-8639999999999999"), instant("8640000000000000"))).toMatchObject({ ok: true, milliseconds: "17279999999999999" });
  });

  it.each(["", "2024-01", "2024-01-01", "2024-01-01T00:00:00", "2023-02-29T00:00:00Z", "2024-04-31T00:00:00Z", "2024-01-01T24:00:00Z", "2024-01-01T00:00:60Z", "2024-01-01T00:00:00+24:00", "+999999-01-01T00:00:00Z"])("rejects invalid or ambiguous ISO input %j", (value) => {
    expect(parseInstant(instant(value, "iso")).ok).toBe(false);
  });

  it.each(["", "abc", "1e3", "0xff", "1.5", "8640000000000001"])("rejects invalid millisecond input %j", (value) => {
    expect(parseInstant(instant(value)).ok).toBe(false);
  });

  it("rejects sub-millisecond precision and handles negative fractions", () => {
    expect(parseInstant(instant("1.0001", "s")).ok).toBe(false);
    expect(calculateTimeDifference(instant("0"), instant("-0.001", "s"))).toMatchObject({ ok: true, milliseconds: "-1", seconds: "-0.001" });
  });
});
