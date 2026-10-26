import { describe, expect, it } from "vitest";
import { detectUnit, fromEpoch, toEpoch } from "@/lib/time-utils";

describe("detectUnit", () => {
  it("detects seconds", () => {
    expect(detectUnit(1_700_000_000)).toBe("s");
  });

  it("detects milliseconds", () => {
    expect(detectUnit(1_700_000_000_000)).toBe("ms");
  });

  it("detects microseconds and nanoseconds", () => {
    expect(detectUnit(1_700_000_000_000_000)).toBe("us");
    expect(detectUnit(1_700_000_000_000_000_000)).toBe("ns");
  });

  it("detects negative timestamps by magnitude", () => {
    expect(detectUnit(-1_700_000_000)).toBe("s");
  });
});

describe("fromEpoch", () => {
  it("converts zero to the Unix epoch", () => {
    const result = fromEpoch(0);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe("1970-01-01T00:00:00.000Z");
      expect(result.unitUsed).toBe("s");
    }
  });

  it("converts seconds to ISO 8601", () => {
    const result = fromEpoch(1_700_000_000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe("2023-11-14T22:13:20.000Z");
    }
  });

  it("auto-detects milliseconds", () => {
    const result = fromEpoch(1_700_000_000_000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe("2023-11-14T22:13:20.000Z");
      expect(result.unitUsed).toBe("ms");
    }
  });

  it("supports negative timestamps", () => {
    const result = fromEpoch(-1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe("1969-12-31T23:59:59.000Z");
    }
  });

  it("rejects nonnumeric input", () => {
    expect(fromEpoch("abc").ok).toBe(false);
  });

  it("supports a manual unit override", () => {
    const result = fromEpoch(1_700_000_000, "ms");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unitUsed).toBe("ms");
    }
  });

  it("rejects out-of-range timestamps", () => {
    expect(fromEpoch("999999999999999999999999").ok).toBe(false);
  });
});

describe("toEpoch", () => {
  it("converts an ISO 8601 leap-day timestamp", () => {
    const result = toEpoch("2024-02-29T00:00:00Z");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.seconds).toBe(1_709_164_800);
      expect(result.milliseconds).toBe(1_709_164_800_000);
    }
  });

  it("rejects invalid dates", () => {
    expect(toEpoch("not a date").ok).toBe(false);
  });

  it("rejects impossible calendar days that Date.parse would roll over", () => {
    expect(toEpoch("2023-02-29").ok).toBe(false);
    expect(toEpoch("2023-02-29T00:00:00Z").ok).toBe(false);
    expect(toEpoch("2024-04-31").ok).toBe(false);
    expect(toEpoch("2024-06-31T09:30:00Z").ok).toBe(false);
    expect(toEpoch("2024-02-30").ok).toBe(false);
    expect(toEpoch("February 30, 2024").ok).toBe(false);
    expect(toEpoch("Feb 30 2024").ok).toBe(false);
    expect(toEpoch("2024/02/30").ok).toBe(false);
    expect(toEpoch("30 February 2024").ok).toBe(false);
    expect(toEpoch("Tue, 31 Apr 2024 10:00:00 GMT").ok).toBe(false);
  });

  it.each(["02/30/2024", "2/30/2024", "02/29/2023", "04/31/2024"])(
    "rejects impossible US-style numeric date %s",
    (input) => {
      expect(toEpoch(input).ok).toBe(false);
    }
  );

  it("accepts valid US-style dates and preserves their local calendar day", () => {
    const dates = [
      ["02/29/2024", 2024, 1, 29],
      ["2/29/2024", 2024, 1, 29],
      ["02/9/2024", 2024, 1, 9],
      ["2/09/2024", 2024, 1, 9],
      ["12/31/2024", 2024, 11, 31],
    ] as const;

    for (const [input, year, month, day] of dates) {
      const result = toEpoch(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const date = new Date(result.milliseconds);
        expect(date.getFullYear()).toBe(year);
        expect(date.getMonth()).toBe(month);
        expect(date.getDate()).toBe(day);
      }
    }
  });

  it("accepts month names followed by a four-digit year without a day", () => {
    const february = toEpoch("Feb 3000");
    expect(february.ok).toBe(true);
    if (february.ok) {
      expect(new Date(february.milliseconds).getFullYear()).toBe(3000);
    }

    const april = toEpoch("Apr 3100");
    expect(april.ok).toBe(true);
    if (april.ok) {
      expect(new Date(april.milliseconds).getFullYear()).toBe(3100);
    }
  });

  it("accepts valid leap days in the supported formats", () => {
    const monthName = toEpoch("February 29, 2024");
    expect(monthName.ok).toBe(true);
    if (monthName.ok) {
      const date = new Date(monthName.milliseconds);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(1);
      expect(date.getDate()).toBe(29);
    }

    const slashes = toEpoch("2024/02/29");
    expect(slashes.ok).toBe(true);
    if (slashes.ok) {
      const date = new Date(slashes.milliseconds);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(1);
      expect(date.getDate()).toBe(29);
    }

    const abbreviated = toEpoch("Feb 29 2024");
    expect(abbreviated.ok).toBe(true);
    if (abbreviated.ok) {
      const date = new Date(abbreviated.milliseconds);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(1);
      expect(date.getDate()).toBe(29);
    }

    const iso = toEpoch("2024-02-29T00:00:00Z");
    expect(iso.ok).toBe(true);
    if (iso.ok) {
      expect(iso.seconds).toBe(1_709_164_800);
    }
  });

  it("accepts a valid date whose offset lands on the next UTC day", () => {
    const result = toEpoch("2023-02-28T23:00:00-05:00");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.seconds).toBe(1_677_643_200);
    }
  });

  it("rejects empty input", () => {
    expect(toEpoch("").ok).toBe(false);
  });
});
