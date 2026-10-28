import { describe, it, expect } from "vitest";
import { formatUuid, inspectUuid, uuidV4, uuidV7 } from "../uuid";
import { getGuide } from "../guides";

// Every UUID and result printed in /guides/uuid-v4-vs-v7-generate-uuid is
// produced or read back by the UUID tool's own functions here.

const ones = new Uint8Array(16).fill(0xff);
const zeros = new Uint8Array(16);
const ramp = Uint8Array.from({ length: 16 }, (_, i) => 0x11 * i);
const NOON = Date.UTC(2026, 9, 28, 12, 0, 0);

describe("uuid guide: how a UUID is written", () => {
  it("writes 32 hex digits in groups of 8-4-4-4-12", () => {
    const text = formatUuid(ramp);
    expect(text).toBe("00112233-4455-6677-8899-aabbccddeeff");
    expect(text.split("-").map((g) => g.length)).toEqual([8, 4, 4, 4, 12]);
    expect(text.split("-").map((g) => g.length / 2)).toEqual([4, 2, 2, 2, 6]);
  });

  it("is the same UUID without hyphens, in either case", () => {
    expect(formatUuid(ramp, { hyphens: false })).toBe("00112233445566778899aabbccddeeff");
    expect(formatUuid(ramp, { uppercase: true, hyphens: false })).toBe("00112233445566778899AABBCCDDEEFF");
  });
});

describe("uuid guide: version and variant", () => {
  it("reads the example UUID as version 4 with the RFC variant", () => {
    const example = "550e8400-e29b-41d4-a716-446655440000";
    expect(inspectUuid(example)).toEqual({ ok: true, version: 4, variant: "rfc" });
    expect(example.split("-")[2][0]).toBe("4");
    expect(example.split("-")[3][0]).toBe("a");
  });

  it("maps the leading variant bits like the guide's table", () => {
    const variantOf = (digit: string) => {
      const r = inspectUuid(`12345678-1234-1234-${digit}234-123456789012`);
      return r.ok ? r.variant : null;
    };
    for (const d of ["0", "1", "2", "3", "4", "5", "6", "7"]) expect(variantOf(d)).toBe("ncs");
    for (const d of ["8", "9", "a", "b"]) expect(variantOf(d)).toBe("rfc");
    for (const d of ["c", "d"]) expect(variantOf(d)).toBe("microsoft");
    for (const d of ["e", "f"]) expect(variantOf(d)).toBe("future");
    expect(inspectUuid("12345678-1234-1234-c234-123456789012")).toMatchObject({ variant: "microsoft" });
  });

  it("gives every generated v4 and v7 UUID the RFC variant digit 8, 9, a or b", () => {
    for (let i = 0; i < 200; i += 1) {
      const random = Uint8Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
      expect(formatUuid(uuidV4(random)).split("-")[3][0]).toMatch(/[89ab]/);
      expect(formatUuid(uuidV7(NOON, random)).split("-")[3][0]).toMatch(/[89ab]/);
    }
  });
});

describe("uuid guide: version 4", () => {
  it("leaves 122 random bits and fixes six", () => {
    expect(formatUuid(uuidV4(ones))).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
    expect(formatUuid(uuidV4(zeros))).toBe("00000000-0000-4000-8000-000000000000");
    let fixed = 0;
    const a = uuidV4(ones);
    const b = uuidV4(zeros);
    for (let i = 0; i < 16; i += 1) {
      const diff = (a[i] ^ b[i]).toString(2).replace(/0/g, "").length;
      fixed += 8 - diff;
    }
    expect(fixed).toBe(6);
    expect(128 - fixed).toBe(122);
  });
});

describe("uuid guide: version 7", () => {
  it("puts the Unix time in the first 48 bits", () => {
    expect(NOON).toBe(1793188800000);
    expect(new Date(NOON).toISOString()).toBe("2026-10-28T12:00:00.000Z");
    expect(formatUuid(uuidV7(NOON, zeros))).toBe("01a18261-a600-7000-8000-000000000000");
    expect(formatUuid(uuidV7(NOON, ones))).toBe("01a18261-a600-7fff-bfff-ffffffffffff");
    expect(NOON.toString(16).padStart(12, "0")).toBe("01a18261a600");
  });

  it("reads the timestamp back from either extreme", () => {
    for (const random of [zeros, ones]) {
      expect(inspectUuid(formatUuid(uuidV7(NOON, random)))).toEqual({
        ok: true,
        version: 7,
        variant: "rfc",
        timestampMs: NOON,
      });
    }
  });

  it("has 48 + 12 + 62 random-or-timestamp bits and 74 random bits", () => {
    expect(48 + 4 + 12 + 2 + 62).toBe(128);
    expect(12 + 62).toBe(74);
  });

  it("sorts by creation time, as bytes and as text, across milliseconds", () => {
    const a = formatUuid(uuidV7(NOON, ones));
    const b = formatUuid(uuidV7(NOON + 1, zeros));
    expect(a < b).toBe(true);
    const bytesA = uuidV7(NOON, ones);
    const bytesB = uuidV7(NOON + 1, zeros);
    expect(Buffer.compare(bytesA, bytesB)).toBe(-1);
    const upperA = formatUuid(uuidV7(NOON, ones), { uppercase: true });
    const upperB = formatUuid(uuidV7(NOON + 1, zeros), { uppercase: true });
    expect(upperA < upperB).toBe(true);
  });

  it("does not order two UUIDs from the same millisecond by creation", () => {
    const first = formatUuid(uuidV7(NOON, ones));
    const second = formatUuid(uuidV7(NOON, zeros));
    expect(first > second).toBe(true);
  });

  it("makes the same-millisecond UUIDs differ only after the timestamp", () => {
    const a = formatUuid(uuidV7(NOON, ones));
    const b = formatUuid(uuidV7(NOON, zeros));
    expect(a.slice(0, 13)).toBe(b.slice(0, 13));
    expect(a).not.toBe(b);
  });
});

describe("uuid guide: nil and max", () => {
  it("recognizes the nil UUID", () => {
    expect(inspectUuid("00000000-0000-0000-0000-000000000000")).toEqual({
      ok: true,
      version: 0,
      variant: "ncs",
      special: "nil",
    });
  });

  it("recognizes the max UUID", () => {
    expect(inspectUuid("ffffffff-ffff-ffff-ffff-ffffffffffff")).toEqual({
      ok: true,
      version: 15,
      variant: "future",
      special: "max",
    });
  });
});

describe("uuid guide: collision odds", () => {
  it("matches the birthday approximation in the guide", () => {
    const space = 2 ** 122;
    const fifty = Math.sqrt(2 * space * Math.LN2);
    const oneInBillion = Math.sqrt(2 * space * 1e-9);
    expect(fifty / 1e18).toBeCloseTo(2.7, 1);
    expect(oneInBillion / 1e14).toBeCloseTo(1.03, 2);
  });
});

describe("uuid guide: the inspector's input rules", () => {
  it("accepts compact and uppercase input", () => {
    expect(inspectUuid("550E8400E29B41D4A716446655440000")).toEqual({ ok: true, version: 4, variant: "rfc" });
  });

  it("accepts a UUID wrapped in braces or with a urn:uuid: prefix", () => {
    expect(inspectUuid("{550e8400-e29b-41d4-a716-446655440000}")).toEqual({ ok: true, version: 4, variant: "rfc" });
    expect(inspectUuid("urn:uuid:550e8400-e29b-41d4-a716-446655440000")).toEqual({ ok: true, version: 4, variant: "rfc" });
    expect(inspectUuid("550e8400-e29b-41d4-a716")).toEqual({ ok: false });
  });
});

describe("uuid guide: registry entry", () => {
  const guide = getGuide("uuid-v4-vs-v7-generate-uuid")!;

  it("exists and points at the UUID Generator", () => {
    expect(guide).toBeDefined();
    expect(guide.relatedTools).toContain("uuid-generator");
    expect(guide.publishedAt).toBe("2026-10-28");
  });

  it("states the same collision figures as the maths", () => {
    const answer = guide.faqs!.find((f) => f.q.startsWith("Can two UUIDs"))!.a;
    expect(answer).toContain("103 trillion");
  });
});
