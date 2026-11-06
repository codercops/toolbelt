import { describe, it, expect } from "vitest";
import {
  inspectUnicode,
  getNormalization,
  utf8ByteCount,
  codePointCount,
  INSPECTION_LIMIT,
} from "../unicode-inspector";

describe("utf8ByteCount", () => {
  it("counts UTF-8 bytes across ASCII, BMP, supplementary, and unpaired surrogates", () => {
    expect(utf8ByteCount("abc")).toBe(3);
    expect(utf8ByteCount("\u00a0")).toBe(2);
    expect(utf8ByteCount("\u2603")).toBe(3);
    expect(utf8ByteCount("😀")).toBe(4);
    expect(utf8ByteCount(String.fromCharCode(0xd800))).toBe(3);
  });
});

describe("codePointCount", () => {
  it("accurately counts code points across surrogate pairs and mixed strings", () => {
    expect(codePointCount("abc")).toBe(3);
    expect(codePointCount("😀")).toBe(1);
    expect(codePointCount(String.fromCharCode(0xd800))).toBe(1);
    expect(codePointCount("A😀B")).toBe(3);
  });
});

describe("inspectUnicode", () => {
  it("produces one row per ASCII character with offsets and encodings", () => {
    const { rows } = inspectUnicode("AB");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      codePoint: 0x41,
      codePointStr: "U+0041",
      char: "A",
      utf16Offset: 0,
      utf16Length: 1,
      utf16Hex: ["0041"],
      utf8Hex: ["41"],
      invisibleLabel: null,
      unpairedSurrogate: false,
    });
    expect(rows[1]).toMatchObject({ codePoint: 0x42, utf16Offset: 1 });
  });

  it("handles supplementary characters (surrogate pairs)", () => {
    const { rows } = inspectUnicode("😀");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      codePoint: 0x1f600,
      codePointStr: "U+1F600",
      utf16Length: 2,
      utf16Hex: ["D83D", "DE00"],
      utf8Hex: ["F0", "9F", "98", "80"],
      invisibleLabel: null,
      unpairedSurrogate: false,
    });
  });

  it("keeps combining marks as separate rows", () => {
    const { rows } = inspectUnicode("e\u0301");
    expect(rows).toHaveLength(2);
    expect(rows[0].codePoint).toBe(0x65);
    expect(rows[1].codePoint).toBe(0x0301);
  });

  it("splits CRLF into two separate rows", () => {
    const { rows } = inspectUnicode("\r\n");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ codePoint: 0x0d, invisibleLabel: "CR" });
    expect(rows[1]).toMatchObject({ codePoint: 0x0a, invisibleLabel: "LF" });
  });

  it("labels unpaired surrogates and emits empty char with U+FFFD UTF-8 replacement", () => {
    const high = inspectUnicode(String.fromCharCode(0xd800)).rows[0];
    expect(high.unpairedSurrogate).toBe(true);
    expect(high.char).toBe("");
    expect(high.invisibleLabel).toBe("UNPAIRED HIGH SURROGATE");
    expect(high.utf8Hex).toEqual(["EF", "BF", "BD"]);

    const low = inspectUnicode(String.fromCharCode(0xdc00)).rows[0];
    expect(low.unpairedSurrogate).toBe(true);
    expect(low.invisibleLabel).toBe("UNPAIRED LOW SURROGATE");
  });

  it("labels invisible, whitespace, and formatting characters", () => {
    expect(inspectUnicode(" ").rows[0].invisibleLabel).toBe("SPACE");
    expect(inspectUnicode("\t").rows[0].invisibleLabel).toBe("TAB");
    expect(inspectUnicode("\u00a0").rows[0]).toMatchObject({
      invisibleLabel: "NO-BREAK SPACE",
      intentional: true,
    });
    expect(inspectUnicode("\u2002").rows[0].invisibleLabel).toBe("EN SPACE");
    expect(inspectUnicode("\u2009").rows[0].invisibleLabel).toBe("THIN SPACE");
    expect(inspectUnicode("\u200a").rows[0].invisibleLabel).toBe("HAIR SPACE");
    expect(inspectUnicode("\u202f").rows[0]).toMatchObject({
      invisibleLabel: "NARROW NO-BREAK SPACE",
      intentional: true,
    });
    expect(inspectUnicode("\u205f").rows[0].invisibleLabel).toBe("MEDIUM MATHEMATICAL SPACE");
    expect(inspectUnicode("\u200b").rows[0]).toMatchObject({
      invisibleLabel: "ZERO WIDTH SPACE",
      intentional: false,
    });
    expect(inspectUnicode("\u200d").rows[0]).toMatchObject({
      invisibleLabel: "ZERO WIDTH JOINER",
      intentional: true,
    });
    expect(inspectUnicode("\ufeff").rows[0].invisibleLabel).toBe("BYTE ORDER MARK (BOM)");
  });

  it("labels DELETE as a control character, like the other controls", () => {
    expect(inspectUnicode("\u007f").rows[0]).toMatchObject({
      invisibleLabel: "CONTROL (U+007F)",
      intentional: false,
    });
    expect(inspectUnicode("a\u007fb").rows.map((row) => row.invisibleLabel)).toEqual([null, "CONTROL (U+007F)", null]);
  });

  it("labels the Hangul filler and the blank Braille pattern, which show nothing on screen", () => {
    expect(inspectUnicode("\u3164").rows[0]).toMatchObject({
      invisibleLabel: "HANGUL FILLER",
      intentional: true,
    });
    expect(inspectUnicode("\u2800").rows[0]).toMatchObject({
      invisibleLabel: "BRAILLE PATTERN BLANK",
      intentional: false,
    });
  });

  it("keeps the other Hangul fillers as they were", () => {
    expect(inspectUnicode("\u115f").rows[0]).toMatchObject({ invisibleLabel: "HANGUL CHOSEONG FILLER", intentional: true });
    expect(inspectUnicode("\u1160").rows[0]).toMatchObject({ invisibleLabel: "HANGUL JUNGSEONG FILLER", intentional: true });
    expect(inspectUnicode("\uffa0").rows[0]).toMatchObject({ invisibleLabel: "HALFWIDTH HANGUL FILLER", intentional: true });
  });

  it("does not label the characters next to them, which are visible", () => {
    for (const visible of ["~", "\u00a1", "\u2801", "\u28ff", "\u3163", "\u3165", "\u3001", "\u4e2d", "a", "0"]) {
      expect(inspectUnicode(visible).rows[0].invisibleLabel, visible.codePointAt(0)?.toString(16)).toBeNull();
    }
  });

  it("labels every control, space separator and format character in the BMP", () => {
    const unlabelled: string[] = [];
    for (let code = 0; code <= 0xffff; code++) {
      if (code >= 0xd800 && code <= 0xdfff) continue;
      const char = String.fromCharCode(code);
      if (/[\p{Cc}\p{Zs}\p{Cf}]/u.test(char) && inspectUnicode(char).rows[0].invisibleLabel === null) {
        unlabelled.push(`U+${code.toString(16).toUpperCase().padStart(4, "0")}`);
      }
    }
    expect(unlabelled).toEqual([]);
  });

  it("falls back to category labels for unlisted Zs or Cf characters", () => {
    expect(inspectUnicode("\u0600").rows[0]).toMatchObject({
      invisibleLabel: "FORMAT CHARACTER",
      intentional: true,
    });
  });

  it("reports correct UTF-16 offsets and counts for mixed characters", () => {
    const result = inspectUnicode("A😀B");
    expect(result.utf16Count).toBe(4);
    expect(result.codePointCount).toBe(3);
    expect(result.rows[0].utf16Offset).toBe(0);
    expect(result.rows[1].utf16Offset).toBe(1);
    expect(result.rows[2].utf16Offset).toBe(3);
  });

  it("enforces INSPECTION_LIMIT truncation", () => {
    expect(inspectUnicode("a".repeat(INSPECTION_LIMIT)).truncated).toBe(false);
    const overLimit = inspectUnicode("a".repeat(INSPECTION_LIMIT + 10));
    expect(overLimit.truncated).toBe(true);
    expect(overLimit.rows).toHaveLength(INSPECTION_LIMIT);
  });

  it("handles an empty string", () => {
    const result = inspectUnicode("");
    expect(result.rows).toHaveLength(0);
    expect(result.utf16Count).toBe(0);
    expect(result.codePointCount).toBe(0);
    expect(result.utf8ByteCount).toBe(0);
    expect(result.truncated).toBe(false);
  });
});

describe("getNormalization", () => {
  it("reports no change for plain ASCII or already-composed text", () => {
    expect(getNormalization("hello")).toMatchObject({
      nfc: "hello",
      nfd: "hello",
      nfcChanged: false,
      nfdChanged: false,
    });
    expect(getNormalization("\u00e9").nfcChanged).toBe(false);
  });

  it("composes decomposed text in NFC and decomposes precomposed text in NFD", () => {
    const composed = getNormalization("e\u0301");
    expect(composed.nfcChanged).toBe(true);
    expect(composed.nfc).toBe("\u00e9");

    const decomposed = getNormalization("\u00e9");
    expect(decomposed.nfdChanged).toBe(true);
    expect(decomposed.nfd).toBe("e\u0301");
  });
});
