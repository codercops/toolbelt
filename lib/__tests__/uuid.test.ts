import { describe, expect, it } from "vitest";
import { formatUuid, inspectUuid, uuidV4, uuidV7 } from "@/lib/uuid";

const randomBytes = () => new Uint8Array(16).fill(0xff);

describe("UUID generation", () => {
  it("sets the v4 version nibble and RFC variant bits without mutating input", () => {
    const random = randomBytes();
    const uuid = uuidV4(random);

    expect(uuid).toHaveLength(16);
    expect(uuid[6] >> 4).toBe(4);
    expect(uuid[8] >> 6).toBe(2);
    expect(random[6]).toBe(0xff);
    expect(random[8]).toBe(0xff);
  });

  it("sets the v7 version and variant and round-trips the timestamp", () => {
    const nowMs = 1_798_359_600_123;
    const uuid = uuidV7(nowMs, randomBytes());
    const inspected = inspectUuid(formatUuid(uuid));

    expect(uuid[6] >> 4).toBe(7);
    expect(uuid[8] >> 6).toBe(2);
    expect(inspected).toMatchObject({
      ok: true,
      version: 7,
      variant: "rfc",
      timestampMs: nowMs,
    });
  });

  it("sorts v7 UUIDs in timestamp order", () => {
    const random = new Uint8Array(16);
    const earlier = formatUuid(uuidV7(1_700_000_000_000, random));
    const later = formatUuid(uuidV7(1_700_000_000_001, random));

    expect(earlier < later).toBe(true);
  });

  it("rejects timestamps outside the 48-bit millisecond range", () => {
    expect(() => uuidV7(-1, randomBytes())).toThrow(RangeError);
    expect(() => uuidV7(0x1000000000000, randomBytes())).toThrow(RangeError);
    expect(() => uuidV7(1.5, randomBytes())).toThrow(RangeError);
  });

  it("requires exactly 16 bytes of randomness", () => {
    expect(() => uuidV4(new Uint8Array(15))).toThrow(RangeError);
    expect(() => uuidV7(0, new Uint8Array(17))).toThrow(RangeError);
  });
});

describe("formatUuid", () => {
  it("supports uppercase and compact output", () => {
    const uuid = uuidV4(new Uint8Array(16).fill(0xab));

    expect(formatUuid(uuid, { uppercase: true })).toBe("ABABABAB-ABAB-4BAB-ABAB-ABABABABABAB");
    expect(formatUuid(uuid, { hyphens: false })).toBe("abababababab4bababababababababab");
  });
});

describe("inspectUuid", () => {
  it("rejects malformed UUIDs and accepts canonical or compact text", () => {
    expect(inspectUuid("not-a-uuid")).toEqual({ ok: false });
    expect(inspectUuid("00000000-0000-4000-8000-00000000000")).toEqual({ ok: false });
    expect(inspectUuid("00000000000040008000000000000000")).toMatchObject({
      ok: true,
      version: 4,
      variant: "rfc",
    });
  });

  it("recognizes nil and max UUIDs", () => {
    expect(inspectUuid("00000000-0000-0000-0000-000000000000")).toMatchObject({
      ok: true,
      version: 0,
      variant: "ncs",
      special: "nil",
    });
    expect(inspectUuid("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF")).toMatchObject({
      ok: true,
      version: 15,
      variant: "future",
      special: "max",
    });
  });

  it("reports non-RFC variants", () => {
    expect(inspectUuid("00000000-0000-4000-0000-000000000000")).toMatchObject({
      ok: true,
      variant: "ncs",
    });
    expect(inspectUuid("00000000-0000-4000-C000-000000000000")).toMatchObject({
      ok: true,
      variant: "microsoft",
    });
    expect(inspectUuid("00000000-0000-4000-E000-000000000000")).toMatchObject({
      ok: true,
      variant: "future",
    });
  });

  it.each([
    ["braces", "{3f2504e0-4f89-41d3-9a0c-0305e82c3301}"],
    ["a urn:uuid: prefix", "urn:uuid:3f2504e0-4f89-41d3-9a0c-0305e82c3301"],
    ["an upper case URN:UUID: prefix", "URN:UUID:3F2504E0-4F89-41D3-9A0C-0305E82C3301"],
    ["surrounding whitespace", "  {3f2504e0-4f89-41d3-9a0c-0305e82c3301}\n"],
  ])("inspects a UUID with %s the same as the bare value", (_label, text) => {
    expect(inspectUuid(text)).toEqual(inspectUuid("3f2504e0-4f89-41d3-9a0c-0305e82c3301"));
    expect(inspectUuid(text)).toMatchObject({ ok: true, version: 4, variant: "rfc" });
  });

  it.each([
    "{3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    "3f2504e0-4f89-41d3-9a0c-0305e82c3301}",
    "{{3f2504e0-4f89-41d3-9a0c-0305e82c3301}}",
    "urn:uuid:{3f2504e0-4f89-41d3-9a0c-0305e82c3301}",
    "uuid:3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  ])("rejects %s", (text) => {
    expect(inspectUuid(text)).toEqual({ ok: false });
  });

  it("does not report a timestamp for non-v7 UUIDs", () => {
    expect(inspectUuid("00000000-0000-4000-8000-000000000000")).not.toHaveProperty("timestampMs");
  });
});
