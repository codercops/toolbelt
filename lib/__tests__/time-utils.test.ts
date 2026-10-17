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

  it("rejects empty input", () => {
    expect(toEpoch("").ok).toBe(false);
  });
});
