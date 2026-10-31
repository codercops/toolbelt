export const INSPECTION_LIMIT = 5_000;

interface InvisibleEntry {
  label: string;
  intentional?: boolean;
}

const INVISIBLE: Record<number, InvisibleEntry> = {
  0x0000: { label: "NULL" },
  0x0007: { label: "BELL" },
  0x0008: { label: "BACKSPACE" },
  0x0009: { label: "TAB" },
  0x000a: { label: "LF" },
  0x000b: { label: "VERTICAL TAB" },
  0x000c: { label: "FORM FEED" },
  0x000d: { label: "CR" },
  0x001b: { label: "ESCAPE" },
  0x0020: { label: "SPACE" },
  0x00a0: { label: "NO-BREAK SPACE", intentional: true },
  0x00ad: { label: "SOFT HYPHEN", intentional: true },
  0x034f: { label: "COMBINING GRAPHEME JOINER", intentional: true },
  0x061c: { label: "ARABIC LETTER MARK", intentional: true },
  0x115f: { label: "HANGUL CHOSEONG FILLER", intentional: true },
  0x1160: { label: "HANGUL JUNGSEONG FILLER", intentional: true },
  0x1680: { label: "OGHAM SPACE MARK" },
  0x17b4: { label: "KHMER VOWEL INHERENT AQ", intentional: true },
  0x17b5: { label: "KHMER VOWEL INHERENT AA", intentional: true },
  0x180e: { label: "MONGOLIAN VOWEL SEPARATOR" },
  0x2000: { label: "EN QUAD" },
  0x2001: { label: "EM QUAD" },
  0x2002: { label: "EN SPACE" },
  0x2003: { label: "EM SPACE" },
  0x2004: { label: "THREE-PER-EM SPACE" },
  0x2005: { label: "FOUR-PER-EM SPACE" },
  0x2006: { label: "SIX-PER-EM SPACE" },
  0x2007: { label: "FIGURE SPACE" },
  0x2008: { label: "PUNCTUATION SPACE" },
  0x2009: { label: "THIN SPACE" },
  0x200a: { label: "HAIR SPACE" },
  0x200b: { label: "ZERO WIDTH SPACE" },
  0x200c: { label: "ZERO WIDTH NON-JOINER", intentional: true },
  0x200d: { label: "ZERO WIDTH JOINER", intentional: true },
  0x200e: { label: "LEFT-TO-RIGHT MARK", intentional: true },
  0x200f: { label: "RIGHT-TO-LEFT MARK", intentional: true },
  0x2028: { label: "LINE SEPARATOR" },
  0x2029: { label: "PARAGRAPH SEPARATOR" },
  0x202a: { label: "LEFT-TO-RIGHT EMBEDDING", intentional: true },
  0x202b: { label: "RIGHT-TO-LEFT EMBEDDING", intentional: true },
  0x202c: { label: "POP DIRECTIONAL FORMATTING", intentional: true },
  0x202d: { label: "LEFT-TO-RIGHT OVERRIDE", intentional: true },
  0x202e: { label: "RIGHT-TO-LEFT OVERRIDE", intentional: true },
  0x202f: { label: "NARROW NO-BREAK SPACE", intentional: true },
  0x205f: { label: "MEDIUM MATHEMATICAL SPACE" },
  0x2060: { label: "WORD JOINER", intentional: true },
  0x2061: { label: "FUNCTION APPLICATION", intentional: true },
  0x2062: { label: "INVISIBLE TIMES", intentional: true },
  0x2063: { label: "INVISIBLE SEPARATOR", intentional: true },
  0x2064: { label: "INVISIBLE PLUS", intentional: true },
  0x206a: { label: "INHIBIT SYMMETRIC SWAPPING", intentional: true },
  0x206b: { label: "ACTIVATE SYMMETRIC SWAPPING", intentional: true },
  0x206c: { label: "INHIBIT ARABIC FORM SHAPING", intentional: true },
  0x206d: { label: "ACTIVATE ARABIC FORM SHAPING", intentional: true },
  0x206e: { label: "NATIONAL DIGIT SHAPES", intentional: true },
  0x206f: { label: "NOMINAL DIGIT SHAPES", intentional: true },
  0x2800: { label: "BRAILLE PATTERN BLANK" },
  0x3000: { label: "IDEOGRAPHIC SPACE" },
  0x3164: { label: "HANGUL FILLER", intentional: true },
  0xfeff: { label: "BYTE ORDER MARK (BOM)" },
  0xffa0: { label: "HALFWIDTH HANGUL FILLER", intentional: true },
  0x1d159: { label: "MUSICAL SYMBOL NULL NOTEHEAD" },
  0x1d173: { label: "MUSICAL SYMBOL BEGIN BEAM", intentional: true },
  0x1d174: { label: "MUSICAL SYMBOL END BEAM", intentional: true },
  0x1d175: { label: "MUSICAL SYMBOL BEGIN TIE", intentional: true },
  0x1d176: { label: "MUSICAL SYMBOL END TIE", intentional: true },
  0x1d177: { label: "MUSICAL SYMBOL BEGIN SLUR", intentional: true },
  0x1d178: { label: "MUSICAL SYMBOL END SLUR", intentional: true },
  0x1d179: { label: "MUSICAL SYMBOL BEGIN PHRASE", intentional: true },
  0x1d17a: { label: "MUSICAL SYMBOL END PHRASE", intentional: true },
  0xe0001: { label: "LANGUAGE TAG", intentional: true },
};

for (let cp = 0x2066; cp <= 0x2069; cp++) {
  INVISIBLE[cp] = { label: "BIDI ISOLATE CONTROL", intentional: true };
}

for (let cp = 0xe0020; cp <= 0xe007e; cp++) {
  INVISIBLE[cp] = { label: "TAG CHARACTER", intentional: true };
}
INVISIBLE[0xe007f] = { label: "CANCEL TAG", intentional: true };

export interface CodePointRow {
  codePoint: number;
  codePointStr: string;
  char: string;
  utf16Offset: number;
  utf16Length: number;
  utf16Hex: string[];
  utf8Hex: string[];
  invisibleLabel: string | null;
  intentional: boolean;
  unpairedSurrogate: boolean;
}

export interface InspectionResult {
  rows: CodePointRow[];
  truncated: boolean;
  codePointCount: number;
  utf16Count: number;
  utf8ByteCount: number;
}

export interface NormalizationResult {
  nfc: string;
  nfd: string;
  nfcChanged: boolean;
  nfdChanged: boolean;
}

function toUtf8Hex(cp: number): string[] {
  if (cp < 0x80) return [hex2(cp)];
  if (cp < 0x800) return [hex2(0xc0 | (cp >> 6)), hex2(0x80 | (cp & 0x3f))];
  if (cp < 0x10000)
    return [
      hex2(0xe0 | (cp >> 12)),
      hex2(0x80 | ((cp >> 6) & 0x3f)),
      hex2(0x80 | (cp & 0x3f)),
    ];
  return [
    hex2(0xf0 | (cp >> 18)),
    hex2(0x80 | ((cp >> 12) & 0x3f)),
    hex2(0x80 | ((cp >> 6) & 0x3f)),
    hex2(0x80 | (cp & 0x3f)),
  ];
}

function hex2(n: number) {
  return n.toString(16).toUpperCase().padStart(2, "0");
}

function hex4(n: number) {
  return n.toString(16).toUpperCase().padStart(4, "0");
}

function codePointStr(cp: number) {
  return (
    "U+" +
    (cp > 0xffff
      ? cp.toString(16).toUpperCase().padStart(5, "0")
      : cp.toString(16).toUpperCase().padStart(4, "0"))
  );
}

export function utf8ByteCount(input: string): number {
  let count = 0;
  for (let i = 0; i < input.length; ) {
    const h = input.charCodeAt(i);
    if (h >= 0xd800 && h <= 0xdbff && i + 1 < input.length) {
      const l = input.charCodeAt(i + 1);
      if (l >= 0xdc00 && l <= 0xdfff) {
        count += 4;
        i += 2;
        continue;
      }
    }
    if (h >= 0xd800 && h <= 0xdfff) {
      count += 3;
    } else if (h < 0x80) {
      count += 1;
    } else if (h < 0x800) {
      count += 2;
    } else {
      count += 3;
    }
    i++;
  }
  return count;
}

export function codePointCount(input: string): number {
  let count = 0;
  for (let i = 0; i < input.length; ) {
    const h = input.charCodeAt(i);
    if (h >= 0xd800 && h <= 0xdbff && i + 1 < input.length) {
      const l = input.charCodeAt(i + 1);
      if (l >= 0xdc00 && l <= 0xdfff) {
        i += 2;
        count++;
        continue;
      }
    }
    i++;
    count++;
  }
  return count;
}

function getInvisibleInfo(cp: number, char: string): { label: string | null; intentional: boolean } {
  const inv = INVISIBLE[cp];
  if (inv) {
    return { label: inv.label, intentional: inv.intentional ?? false };
  }
  const isControl =
    (cp <= 0x1f && cp !== 0x09 && cp !== 0x0a && cp !== 0x0d) ||
    (cp >= 0x7f && cp <= 0x9f);
  if (isControl) {
    return { label: `CONTROL (U+${hex4(cp)})`, intentional: false };
  }
  if (char !== "") {
    if (/\p{Zs}/u.test(char)) {
      return { label: "SPACE SEPARATOR", intentional: false };
    }
    if (/\p{Cf}/u.test(char)) {
      return { label: "FORMAT CHARACTER", intentional: true };
    }
  }
  return { label: null, intentional: false };
}

export function inspectUnicode(input: string): InspectionResult {
  const utf16Count = input.length;
  const utf8Total = utf8ByteCount(input);
  const totalCodePoints = codePointCount(input);

  const rows: CodePointRow[] = [];
  let utf16Offset = 0;
  let rowCount = 0;
  let truncated = false;

  while (utf16Offset < input.length) {
    if (rowCount >= INSPECTION_LIMIT) {
      truncated = true;
      break;
    }

    const high = input.charCodeAt(utf16Offset);

    if (high >= 0xd800 && high <= 0xdbff && utf16Offset + 1 < input.length) {
      const low = input.charCodeAt(utf16Offset + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        const cp = 0x10000 + ((high - 0xd800) << 10) + (low - 0xdc00);
        const char = String.fromCodePoint(cp);
        const info = getInvisibleInfo(cp, char);
        rows.push({
          codePoint: cp,
          codePointStr: codePointStr(cp),
          char,
          utf16Offset,
          utf16Length: 2,
          utf16Hex: [hex4(high), hex4(low)],
          utf8Hex: toUtf8Hex(cp),
          invisibleLabel: info.label,
          intentional: info.intentional,
          unpairedSurrogate: false,
        });
        utf16Offset += 2;
        rowCount++;
        continue;
      }
    }

    if (high >= 0xd800 && high <= 0xdfff) {
      rows.push({
        codePoint: high,
        codePointStr: codePointStr(high),
        char: "",
        utf16Offset,
        utf16Length: 1,
        utf16Hex: [hex4(high)],
        utf8Hex: toUtf8Hex(0xfffd),
        invisibleLabel: high >= 0xdc00 ? "UNPAIRED LOW SURROGATE" : "UNPAIRED HIGH SURROGATE",
        intentional: false,
        unpairedSurrogate: true,
      });
      utf16Offset++;
      rowCount++;
      continue;
    }

    const cp = high;
    const char = cp >= 0x20 ? String.fromCodePoint(cp) : "";
    const info = getInvisibleInfo(cp, char);
    rows.push({
      codePoint: cp,
      codePointStr: codePointStr(cp),
      char,
      utf16Offset,
      utf16Length: 1,
      utf16Hex: [hex4(cp)],
      utf8Hex: toUtf8Hex(cp),
      invisibleLabel: info.label,
      intentional: info.intentional,
      unpairedSurrogate: false,
    });
    utf16Offset++;
    rowCount++;
  }

  return { rows, truncated, codePointCount: totalCodePoints, utf16Count, utf8ByteCount: utf8Total };
}

export function getNormalization(input: string): NormalizationResult {
  const nfc = input.normalize("NFC");
  const nfd = input.normalize("NFD");
  return {
    nfc,
    nfd,
    nfcChanged: nfc !== input,
    nfdChanged: nfd !== input,
  };
}

export interface ExamplePreset {
  label: string;
  text: string;
  description: string;
}

export const EXAMPLES: ExamplePreset[] = [
  {
    label: "Combining accents",
    text: "é vs e\u0301",
    description: "U+00E9 (precomposed) vs e + U+0301 (combining acute accent)",
  },
  {
    label: "Emoji",
    text: "😀🏳️‍🌈",
    description: "Supplementary character + ZWJ emoji sequence",
  },
  {
    label: "Invisible whitespace",
    text: "Hello\u200bWorld\u00a0!\u200c\u200d",
    description: "Zero-width space, no-break space, ZWNJ, ZWJ",
  },
  {
    label: "Bidirectional",
    text: "Price: \u202e100 USD\u202c",
    description: "Right-to-left override + pop directional formatting",
  },
  {
    label: "BOM",
    text: "\ufeffHello",
    description: "Byte order mark at start of string",
  },
];
