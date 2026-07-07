import { describe, it, expect } from "vitest";
import {
  encodeText,
  decodeText,
  detectBase64,
  bytesToBase32,
  bytesToBase58,
  getMimeFromMagicBytes,
} from "../base64-utils";

describe("text round-trip", () => {
  it("encodes and decodes unicode correctly", () => {
    const s = "héllo · 世界 · 🚀";
    const enc = encodeText(s, { urlSafe: false, padding: true });
    const dec = decodeText(enc);
    expect(dec.ok && dec.value).toBe(s);
  });

  it("supports url-safe without padding", () => {
    const enc = encodeText("subjects?_d=1", { urlSafe: true, padding: false });
    expect(enc).not.toContain("+");
    expect(enc).not.toContain("/");
    expect(enc).not.toContain("=");
  });
});

describe("detectBase64", () => {
  it("rejects ordinary words", () => {
    expect(detectBase64("password")).toBe(false);
    expect(detectBase64("helloworld")).toBe(false);
  });

  it("accepts real base64 with digits or padding", () => {
    expect(detectBase64("aGVsbG8gd29ybGQ=")).toBe(true);
    expect(detectBase64(encodeText("hello world", { urlSafe: false, padding: true }))).toBe(true);
  });
});

describe("alternate encodings", () => {
  it("encodes base32 per RFC 4648", () => {
    expect(bytesToBase32(new TextEncoder().encode("foobar"))).toBe("MZXW6YTBOI======");
  });

  it("encodes base58 (bitcoin alphabet)", () => {
    expect(bytesToBase58(new TextEncoder().encode("hello"))).toBe("Cn8eVZg");
  });
});

describe("magic bytes", () => {
  it("detects a PNG signature", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const m = getMimeFromMagicBytes(png);
    expect(m?.mime).toBe("image/png");
    expect(m?.isImage).toBe(true);
  });
});
