import { describe, it, expect } from "vitest";
import { gzipSync } from "node:zlib";
import {
  encodeText,
  decodeText,
  decodeUtf8Bytes,
  detectBase64,
  detectBase64Text,
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
  base64ToBytes,
  gunzipBytes,
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

  it.each([
    { name: "binary data", bytes: [0xff, 0xfe, 0xfd] },
    { name: "a truncated multibyte sequence", bytes: [0xe2, 0x82] },
  ])("rejects $name with file decoding guidance", ({ bytes }) => {
    const encoded = bytesToBase64(new Uint8Array(bytes));
    expect(decodeText(encoded)).toEqual({
      ok: false,
      error: expect.stringMatching(/not valid UTF-8.*Base64 → File/),
    });
  });

  it("preserves a replacement character that was actually encoded as UTF-8", () => {
    const text = "a\uFFFDz";
    expect(decodeText(encodeText(text, { urlSafe: false, padding: true }))).toEqual({
      ok: true,
      value: text,
    });
  });

  it("decodes empty text", () => {
    expect(decodeText("")).toEqual({ ok: true, value: "" });
  });

  it("preserves errors for invalid Base64 syntax", () => {
    const result = base64ToBytes("!");
    expect(result.ok).toBe(false);
    expect(decodeText("!")).toEqual(result);
  });

  it("still decodes binary data as bytes for the file tab", () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0xfd]);
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual({ ok: true, value: bytes });
  });
});

describe("gzip text decoding", () => {
  it.each([
    {
      name: "Unicode text",
      bytes: new TextEncoder().encode("héllo · 世界 · 🚀"),
      expected: { ok: true, value: "héllo · 世界 · 🚀" },
    },
    {
      name: "invalid UTF-8",
      bytes: new Uint8Array([0xff, 0xfe, 0xfd]),
      expected: { ok: false, error: expect.stringMatching(/not valid UTF-8.*Base64 → File/) },
    },
  ])("validates $name after decompression", async ({ bytes, expected }) => {
    const encoded = bytesToBase64(gzipSync(bytes));
    const decoded = base64ToBytes(encoded);
    if (!decoded.ok) throw new Error(decoded.error);
    const decompressed = await gunzipBytes(decoded.value);
    expect(decompressed).not.toBeNull();
    if (!decompressed) throw new Error("Expected gzip decompression to succeed");
    expect(decodeUtf8Bytes(decompressed)).toEqual(expected);
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

describe("detectBase64Text", () => {
  it.each(["password123", "hello-world", "2024-01-15", "user_id_123"])(
    "treats %s as plain text to encode, not base64",
    (text) => {
      // These pass detectBase64 and atob decodes them, but not to readable text.
      expect(detectBase64(text)).toBe(true);
      expect(detectBase64Text(text)).toBe(false);
    },
  );

  it.each(["SGVsbG8=", "aGVsbG8gd29ybGQ"])("treats %s as base64 of text", (b64) => {
    expect(detectBase64Text(b64)).toBe(true);
  });

  it("accepts base64 of text with unicode, URL-safe characters and surrounding spaces", () => {
    expect(detectBase64Text(encodeText("héllo wörld ✓", { urlSafe: false, padding: true }))).toBe(true);
    expect(detectBase64Text(encodeText("subjects?_d=>>>", { urlSafe: true, padding: false }))).toBe(true);
    expect(detectBase64Text("  SGVsbG8gV29ybGQ=  ")).toBe(true);
  });

  it("still rejects things detectBase64 rejects", () => {
    expect(detectBase64Text("password")).toBe(false);
    expect(detectBase64Text("short1")).toBe(false);
    expect(detectBase64Text("two words1234")).toBe(false);
  });

  it("only accepts gzipped base64 when the gzip option is on", () => {
    const gz = bytesToBase64(gzipSync(Buffer.from("hello world, hello world")));
    expect(detectBase64Text(gz)).toBe(false);
    expect(detectBase64Text(gz, { gzip: false })).toBe(false);
    expect(detectBase64Text(gz, { gzip: true })).toBe(true);
  });

  it("doesn't let the gzip option turn plain text into base64", () => {
    expect(detectBase64Text("password123", { gzip: true })).toBe(false);
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
  function makeFtypBox(majorBrand: string, compatibleBrands: string[] = []): Uint8Array {
    const boxSize = 16 + compatibleBrands.length * 4;
    const buf = new Uint8Array(boxSize);
    const view = new DataView(buf.buffer);
    view.setUint32(0, boxSize);
    buf.set(new TextEncoder().encode("ftyp"), 4);
    buf.set(new TextEncoder().encode(majorBrand), 8);
    view.setUint32(12, 0);
    for (let i = 0; i < compatibleBrands.length; i++) {
      buf.set(new TextEncoder().encode(compatibleBrands[i]), 16 + i * 4);
    }
    return buf;
  }

  function makeBmpHeader(dibSize: number): Uint8Array {
    const buf = new Uint8Array(14 + dibSize);
    buf[0] = 0x42; // 'B'
    buf[1] = 0x4d; // 'M'
    const view = new DataView(buf.buffer);
    view.setUint32(2, buf.length, true);
    view.setUint32(10, 14 + dibSize, true);
    view.setUint32(14, dibSize, true);
    return buf;
  }

  it("detects a PNG signature", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const m = getMimeFromMagicBytes(png);
    expect(m?.mime).toBe("image/png");
    expect(m?.isImage).toBe(true);
  });

  describe("ftyp and AVIF detection", () => {
    it("detects AVIF with major brand 'avif'", () => {
      const bytes = makeFtypBox("avif", ["mif1"]);
      const m = getMimeFromMagicBytes(bytes);
      expect(m).toEqual({
        mime: "image/avif",
        extension: "avif",
        label: "AVIF image",
        isImage: true,
      });
    });

    it("detects AVIF with major brand 'avis'", () => {
      const bytes = makeFtypBox("avis", ["msf1"]);
      const m = getMimeFromMagicBytes(bytes);
      expect(m).toEqual({
        mime: "image/avif",
        extension: "avif",
        label: "AVIF image",
        isImage: true,
      });
    });

    it("detects AVIF with compatible brand 'avif' when major brand is generic", () => {
      const bytes = makeFtypBox("mif1", ["mif1", "miaf", "avif"]);
      const m = getMimeFromMagicBytes(bytes);
      expect(m).toEqual({
        mime: "image/avif",
        extension: "avif",
        label: "AVIF image",
        isImage: true,
      });
    });

    it("detects AVIF with compatible brand 'avis' when major brand is generic", () => {
      const bytes = makeFtypBox("msf1", ["msf1", "avis"]);
      const m = getMimeFromMagicBytes(bytes);
      expect(m).toEqual({
        mime: "image/avif",
        extension: "avif",
        label: "AVIF image",
        isImage: true,
      });
    });

    it.each(["heic", "heix", "hevc"])("preserves HEIC detection for major brand %s", (brand) => {
      const bytes = makeFtypBox(brand);
      const m = getMimeFromMagicBytes(bytes);
      expect(m).toEqual({
        mime: "image/heic",
        extension: "heic",
        label: "HEIC image",
        isImage: true,
      });
    });

    it.each(["mp42", "isom"])("preserves MP4 detection for major brand %s", (brand) => {
      const bytes = makeFtypBox(brand, ["isom", brand]);
      const m = getMimeFromMagicBytes(bytes);
      expect(m).toEqual({
        mime: "video/mp4",
        extension: "mp4",
        label: "MP4 video",
        isImage: false,
      });
    });

    it("rejects invalid ftyp boxes whose length is inconsistent or corrupted", () => {
      // 'ftyp' at bytes 4..7 but boxSize is 0
      const invalidZero = new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]);
      expect(getMimeFromMagicBytes(invalidZero)).toBeNull();

      // 'ftyp' at bytes 4..7 in text ("1234ftyp5678901234")
      const textWithFtyp = new TextEncoder().encode("1234ftyp5678901234");
      const m = getMimeFromMagicBytes(textWithFtyp);
      expect(m?.mime).toBe("text/plain");
    });
  });

  describe("plain UTF-8 text detection (#249)", () => {
    it.each([
      ["Grüße aus München, schöne Straße."],
      ["Voilà, à bientôt !"],
      ["Привет, мир!"],
      ["नमस्ते दुनिया"],
      ["こんにちは世界。"],
    ])("detects non-ASCII UTF-8 text (%s)", (text) => {
      const m = getMimeFromMagicBytes(new TextEncoder().encode(text));
      expect(m?.mime).toBe("text/plain");
      expect(m?.label).toBe("Plain text (UTF-8)");
    });

    it("detects the issue's base64 of a German sentence", () => {
      const r = base64ToBytes("R3LDvMOfZSBhdXMgTcO8bmNoZW4sIHNjaMO2bmUgU3RyYcOfZS4=");
      expect(r.ok).toBe(true);
      if (r.ok) {
        const m = getMimeFromMagicBytes(r.value);
        expect(m?.mime).toBe("text/plain");
      }
    });

    it("still detects ASCII text", () => {
      const m = getMimeFromMagicBytes(new TextEncoder().encode("Hello, plain ASCII text here."));
      expect(m?.mime).toBe("text/plain");
    });

    it("keeps tab, line feed and carriage return as text", () => {
      const m = getMimeFromMagicBytes(new TextEncoder().encode("line\nbreak\ttab\rcr"));
      expect(m?.mime).toBe("text/plain");
    });

    it.each([
      ["an invalid UTF-8 byte", new Uint8Array([0x61, 0xff, 0xfe, 0x62])],
      ["a NUL byte inside text", new Uint8Array([0x61, 0x62, 0x63, 0x00, 0x64, 0x65, 0x66])],
      ["an escape control character", new Uint8Array([0x61, 0x62, 0x1b, 0x5b, 0x41])],
      ["no bytes at all", new Uint8Array(0)],
    ])("refuses %s", (_name, bytes) => {
      expect(getMimeFromMagicBytes(bytes)).toBeNull();
    });
  });

  describe("SVG prolog variations", () => {
    it("detects clean SVG root", () => {
      const bytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>');
      const m = getMimeFromMagicBytes(bytes);
      expect(m).toEqual({
        mime: "image/svg+xml",
        extension: "svg",
        label: "SVG image",
        isImage: true,
      });
    });

    it("detects self-closing SVG root", () => {
      const bytes = new TextEncoder().encode("<svg/>");
      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).toBe("image/svg+xml");
      expect(m?.isImage).toBe(true);
    });

    it("detects SVG after leading whitespace", () => {
      const bytes = new TextEncoder().encode("  \n\t  <svg viewBox=\"0 0 100 100\"><rect/></svg>");
      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).toBe("image/svg+xml");
      expect(m?.isImage).toBe(true);
    });

    it("detects SVG after XML declaration", () => {
      const bytes = new TextEncoder().encode('<?xml version="1.0" encoding="UTF-8"?>\n<svg width="10" height="10"></svg>');
      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).toBe("image/svg+xml");
      expect(m?.isImage).toBe(true);
    });

    it("detects SVG after DOCTYPE", () => {
      const bytes = new TextEncoder().encode(
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg></svg>'
      );
      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).toBe("image/svg+xml");
      expect(m?.isImage).toBe(true);
    });

    it("detects SVG after DOCTYPE with internal subset", () => {
      const bytes = new TextEncoder().encode(
        '<!DOCTYPE svg [\n  <!ENTITY brand "Toolbelt">\n]>\n<svg><text>&brand;</text></svg>'
      );
      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).toBe("image/svg+xml");
      expect(m?.isImage).toBe(true);
    });

    it("detects SVG after comments", () => {
      const bytes = new TextEncoder().encode(
        '<!-- Generator: Adobe Illustrator 25.0.0, SVG Export Plug-In -->\n<!-- Second comment -->\n<svg></svg>'
      );
      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).toBe("image/svg+xml");
      expect(m?.isImage).toBe(true);
    });

    it("detects SVG after combined whitespace, XML declaration, comments, and DOCTYPE", () => {
      const bytes = new TextEncoder().encode(
        '  \n<?xml version="1.0" encoding="utf-8"?>\n' +
        '<!-- Created with Inkscape -->\n' +
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
        '<!-- Ready to render -->\n' +
        '<svg viewBox="0 0 50 50"></svg>'
      );
      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).toBe("image/svg+xml");
      expect(m?.isImage).toBe(true);
    });

    it("does not misclassify unrelated XML as SVG", () => {
      const bytes = new TextEncoder().encode('<?xml version="1.0" encoding="UTF-8"?>\n<note><to>Alice</to></note>');
      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).toBe("application/xml");
      expect(m?.isImage).toBe(false);
    });

    it("does not misclassify HTML with DOCTYPE as SVG", () => {
      const bytes = new TextEncoder().encode('<!DOCTYPE html>\n<html><body><h1>Hello</h1></body></html>');
      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).toBe("text/html");
      expect(m?.isImage).toBe(false);
    });

    it("does not misclassify HTML with leading comments as SVG", () => {
      const bytes = new TextEncoder().encode('<!-- HTML page comment -->\n<html><body><p>Content</p></body></html>');
      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).toBe("text/html");
      expect(m?.isImage).toBe(false);
    });

    it("does not misclassify HTML starting with <html> tag as SVG", () => {
      const bytes = new TextEncoder().encode('<html><head><title>App</title></head><body><svg><circle/></svg></body></html>');
      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).toBe("text/html");
      expect(m?.isImage).toBe(false);
    });
  });

  describe("BMP header validation vs ordinary text", () => {
    it.each([12, 16, 40, 52, 56, 64, 108, 124])(
      "recognizes plausible BMP with DIB header size %i",
      (dibSize) => {
        const bytes = makeBmpHeader(dibSize);
        const m = getMimeFromMagicBytes(bytes);
        expect(m).toEqual({
          mime: "image/bmp",
          extension: "bmp",
          label: "BMP image",
          isImage: true,
        });
      }
    );

    it("does not classify short text 'BM' as BMP", () => {
      const bytes = new TextEncoder().encode("BM");
      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).not.toBe("image/bmp");
    });

    it("does not classify ordinary text beginning with 'BM' as BMP", () => {
      const texts = [
        "BMW is a well-known German automotive brand.",
        "BM: Today's sprint standup notes and action items.",
        "BM1234567890abcdefghijklmnopqrstuvwxyz",
      ];
      for (const text of texts) {
        const bytes = new TextEncoder().encode(text);
        const m = getMimeFromMagicBytes(bytes);
        expect(m?.mime).toBe("text/plain");
        expect(m?.isImage).toBe(false);
      }
    });

    it("rejects BM signature when DIB header size is non-standard", () => {
      const bytes = makeBmpHeader(99);
      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).not.toBe("image/bmp");
    });
  });

  describe("JSON detection and size limits", () => {
    it("recognizes small valid JSON documents", () => {
      const bytes = new TextEncoder().encode(JSON.stringify({ greeting: "hello", count: 42 }));
      const m = getMimeFromMagicBytes(bytes);
      expect(m).toEqual({
        mime: "application/json",
        extension: "json",
        label: "JSON document",
        isImage: false,
      });
    });

    it("recognizes valid JSON documents larger than 4096 bytes", () => {
      const largeObject = {
        title: "Large payload",
        description: "x".repeat(3000),
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `item-name-${i}`,
          data: "sample-data-chunk".repeat(5),
        })),
      };
      const jsonStr = JSON.stringify(largeObject, null, 2);
      const bytes = new TextEncoder().encode(jsonStr);
      expect(bytes.length).toBeGreaterThan(4096);

      const m = getMimeFromMagicBytes(bytes);
      expect(m).toEqual({
        mime: "application/json",
        extension: "json",
        label: "JSON document",
        isImage: false,
      });
    });

    it("recognizes large JSON arrays exceeding 4096 bytes", () => {
      const largeArray = Array.from({ length: 300 }, (_, i) => ({
        index: i,
        key: `field_${i}`,
        value: "abcdefghijklmnopqrstuvwxyz",
      }));
      const bytes = new TextEncoder().encode(JSON.stringify(largeArray));
      expect(bytes.length).toBeGreaterThan(4096);

      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).toBe("application/json");
    });

    it("recognizes valid JSON with leading whitespace", () => {
      const bytes = new TextEncoder().encode("   \n\t  {\"status\": \"ok\", \"code\": 200}");
      const m = getMimeFromMagicBytes(bytes);
      expect(m?.mime).toBe("application/json");
    });

    it("does not classify truncated JSON documents as valid JSON", () => {
      const valid = JSON.stringify({ key: "v".repeat(5000), tail: 123 });
      const truncated = new TextEncoder().encode(valid.slice(0, 4500));
      expect(truncated.length).toBeGreaterThan(4096);

      const m = getMimeFromMagicBytes(truncated);
      expect(m?.mime).not.toBe("application/json");
    });

    it("does not classify small truncated JSON as valid JSON", () => {
      const truncated = new TextEncoder().encode('{"incomplete": true, ');
      const m = getMimeFromMagicBytes(truncated);
      expect(m?.mime).not.toBe("application/json");
    });

    it("skips JSON parsing on documents exceeding the 1 MiB size cap", () => {
      // 1 MiB + 64 bytes
      const hugeBytes = new Uint8Array(1024 * 1024 + 64);
      hugeBytes[0] = 0x7b; // '{'
      hugeBytes[hugeBytes.length - 1] = 0x7d; // '}'
      hugeBytes.fill(0x20, 1, hugeBytes.length - 1); // fill with spaces
      const m = getMimeFromMagicBytes(hugeBytes);
      expect(m?.mime).not.toBe("application/json");
    });
  });
});
