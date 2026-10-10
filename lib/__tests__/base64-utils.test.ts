import { describe, it, expect } from "vitest";
import {
  encodeText,
  decodeText,
  detectBase64,
  bytesToBase32,
  bytesToBase58,
  bytesToAscii85,
  bytesToHex,
  bytesToHexSpaced,
  computeHashes,
  formatBytes,
  getMimeFromMagicBytes,
  splitLines,
  toLanguageLiteral,
  bytesToBase64,
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

  it.each([
    ["", "<~~>"],
    ["M", "<~9`~>"],
    ["Ma", "<~9jn~>"],
    ["Man", "<~9jqo~>"],
    ["Man ", "<~9jqo^~>"],
    ["Man M", "<~9jqo^9`~>"],
  ])("encodes %j as Ascii85", (input, expected) => {
    expect(bytesToAscii85(new TextEncoder().encode(input))).toBe(expected);
  });

  it.each([
    [1, "<~!!~>"],
    [2, "<~!!!~>"],
    [3, "<~!!!!~>"],
    [4, "<~z~>"],
  ] as const)("encodes %i zero bytes without abbreviating a partial group", (length, expected) => {
    expect(bytesToAscii85(new Uint8Array(length))).toBe(expected);
  });

  it("preserves leading zeroes and uses lowercase hex", () => {
    const bytes = new Uint8Array([0, 1, 15, 16, 171, 255]);
    expect(bytesToHex(bytes)).toBe("00010f10abff");
    expect(bytesToHexSpaced(bytes)).toBe("00 01 0f 10 ab ff");
  });

  it("encodes empty bytes as empty hex", () => {
    expect(bytesToHex(new Uint8Array())).toBe("");
    expect(bytesToHexSpaced(new Uint8Array())).toBe("");
  });
});

describe("computeHashes", () => {
  it.each([
    ["", "d41d8cd98f00b204e9800998ecf8427e"],
    ["abc", "900150983cd24fb0d6963f7d28e17f72"],
    ["The quick brown fox jumps over the lazy dog", "9e107d9d372bb6826bd81d3542a419d6"],
  ])("matches the MD5 vector for %j", async (input, expected) => {
    const hashes = await computeHashes(new TextEncoder().encode(input));
    expect(hashes.md5).toBe(expected);
  });

  // Expected values generated once with Node's crypto.createHash("md5").
  it.each([
    [55, "ef1772b6dff9a122358552954ad0df65"],
    [56, "3b0c8ac703f828b04c6c197006d17218"],
    [64, "014842d480b571495a4a0363793f7367"],
  ] as const)("handles MD5 padding for %i bytes", async (length, expected) => {
    const hashes = await computeHashes(new TextEncoder().encode("a".repeat(length)));
    expect(hashes.md5).toBe(expected);
  });

  it("returns all five hash algorithms with the expected keys and digests", async () => {
    const hashes = await computeHashes(new TextEncoder().encode("abc"));
    expect(hashes).toEqual({
      md5: "900150983cd24fb0d6963f7d28e17f72",
      sha1: "a9993e364706816aba3e25717850c26c9cd0d89d",
      sha256: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      sha384: "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
      sha512: "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
    });
  });
});

describe("formatting helpers", () => {
  it("wraps at 76 characters by default without a trailing newline", () => {
    expect(splitLines("")).toBe("");
    expect(splitLines("a".repeat(76))).toBe("a".repeat(76));
    expect(splitLines("a".repeat(76) + "b")).toBe("a".repeat(76) + "\nb");
  });

  it("supports a custom line width", () => {
    expect(splitLines("abcdefg", 3)).toBe("abc\ndef\ng");
  });

  it.each([
    [0, "0 B"],
    [1023, "1023 B"],
    [1024, "1.0 KB"],
    [1536, "1.5 KB"],
    [1024 * 1024, "1.00 MB"],
    [1536 * 1024, "1.50 MB"],
  ] as const)("formats %i bytes as %s", (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });

  it("escapes every single quote in shell literals", () => {
    expect(toLanguageLiteral("it's 'ready'", "shell")).toBe("'it'\\''s '\\''ready'\\'''");
    expect(toLanguageLiteral("", "shell")).toBe("''");
  });

  it("doubles every single quote in SQL literals", () => {
    expect(toLanguageLiteral("it's 'ready'", "sql")).toBe("'it''s ''ready'''");
    expect(toLanguageLiteral("", "sql")).toBe("''");
  });
});

describe("toLanguageLiteral escaping", () => {
  const doubleQuoted = ["javascript", "typescript", "python", "go", "rust", "java"] as const;

  it.each(doubleQuoted)("escapes line breaks in %s literals", (lang) => {
    const value = "line one\nline two\r\n";
    const literal = toLanguageLiteral(value, lang);
    expect(literal).toBe('"line one\\nline two\\r\\n"');
    expect(literal).not.toContain("\n");
    expect(literal).not.toContain("\r");
  });

  it.each(doubleQuoted)("escapes backslashes before line breaks in %s literals", (lang) => {
    // A literal backslash followed by "n" must stay `\\n`, not turn into a newline.
    expect(toLanguageLiteral("a\\nb", lang)).toBe('"a\\\\nb"');
    expect(toLanguageLiteral("a\\\nb", lang)).toBe('"a\\\\\\nb"');
  });

  it.each(doubleQuoted)("wraps a chunked payload in one %s line", (lang) => {
    const encoded = bytesToBase64(new TextEncoder().encode("x".repeat(80)), {
      urlSafe: false,
      padding: true,
    });
    const chunked = splitLines(encoded, 76);
    expect(chunked).toContain("\n");
    expect(toLanguageLiteral(chunked, lang)).toBe(
      `"${chunked.replace(/\n/g, "\\n")}"`
    );
  });

  it("evaluates a chunked payload back to the original string in JavaScript", () => {
    const encoded = bytesToBase64(new TextEncoder().encode("x".repeat(80)), {
      urlSafe: false,
      padding: true,
    });
    const chunked = splitLines(encoded, 76);
    expect(eval(toLanguageLiteral(chunked, "javascript"))).toBe(chunked);
  });

  it("round-trips arbitrary text through eval for JavaScript", () => {
    const value = 'back\\slash "quoted" line1\nline2\r\nend';
    expect(eval(toLanguageLiteral(value, "javascript"))).toBe(value);
  });

  it("leaves shell and SQL output unchanged, line breaks included", () => {
    const value = "line one\nline two";
    expect(toLanguageLiteral(value, "shell")).toBe("'line one\nline two'");
    expect(toLanguageLiteral(value, "sql")).toBe("'line one\nline two'");
    expect(toLanguageLiteral("it's 'ready'", "shell")).toBe("'it'\\''s '\\''ready'\\'''");
    expect(toLanguageLiteral("it's 'ready'", "sql")).toBe("'it''s ''ready'''");
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
