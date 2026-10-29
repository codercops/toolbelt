// Word splitting and case conversion for the Text Case Converter tool.
// Pure functions only — no React, no DOM — so they stay easy to test.

export type CaseStyle =
  | "camel"
  | "pascal"
  | "snake"
  | "constant"
  | "kebab"
  | "dot"
  | "title"
  | "sentence"
  | "lower"
  | "upper";

export const CASE_STYLES: { id: CaseStyle; label: string; example: string }[] = [
  { id: "camel", label: "camelCase", example: "helloWorld" },
  { id: "pascal", label: "PascalCase", example: "HelloWorld" },
  { id: "snake", label: "snake_case", example: "hello_world" },
  { id: "constant", label: "CONSTANT_CASE", example: "HELLO_WORLD" },
  { id: "kebab", label: "kebab-case", example: "hello-world" },
  { id: "dot", label: "dot.case", example: "hello.world" },
  { id: "title", label: "Title Case", example: "Hello World" },
  { id: "sentence", label: "Sentence case", example: "Hello world" },
  { id: "lower", label: "lowercase", example: "hello world" },
  { id: "upper", label: "UPPERCASE", example: "HELLO WORLD" },
];

function splitWordsPreservingCase(input: string, separators: RegExp): string[] {
  const words: string[] = [];
  for (const chunk of input.split(separators)) {
    if (!chunk) continue;
    const spaced = chunk
      .replace(/([\p{Ll}\d])(\p{Lu})/gu, "$1 $2")
      .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, "$1 $2");
    for (const word of spaced.split(" ")) {
      if (word) words.push(word);
    }
  }
  return words;
}

/**
 * Splits identifiers and phrases into lowercase words. Handles separators
 * (spaces, `_`, `-`, `.`, `/` by default), camelCase and PascalCase boundaries,
 * acronyms (`XMLHttpRequest` -> xml, http, request), digits, and non-ASCII letters.
 */
export function splitWords(input: string, separators = /[_\-./\s]+/): string[] {
  return splitWordsPreservingCase(input, separators).map((word) => word.toLowerCase());
}

export type DetectedWordsLine = { lineNumber: number; words: string[] };

/** Returns the original-casing word segments for each non-empty input line. */
export function detectWords(input: string): DetectedWordsLine[] {
  return input.split("\n").flatMap((line, index) => {
    const words = splitWordsPreservingCase(line, /[_\-./\s]+/);
    return words.length ? [{ lineNumber: index + 1, words }] : [];
  });
}

// Identifier styles keep only letters and digits; the prose styles keep punctuation.
const IDENTIFIER_STYLES = new Set<CaseStyle>(["camel", "pascal", "snake", "constant", "kebab", "dot"]);

// In prose, `.` and `/` are punctuation ("3.5", "a/b", a full stop), not word breaks.
const PROSE_SEPARATORS = /[_\-\s]+/;

function convertLine(line: string, style: CaseStyle): string {
  const identifier = IDENTIFIER_STYLES.has(style);
  let words = identifier ? splitWords(line) : splitWords(line, PROSE_SEPARATORS);
  if (identifier) {
    words = words.map((w) => w.replace(/[^\p{L}\p{M}\p{N}]/gu, "")).filter(Boolean);
  }
  if (words.length === 0) return "";
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
  switch (style) {
    case "camel":
      return words.map((w, i) => (i === 0 ? w : cap(w))).join("");
    case "pascal":
      return words.map(cap).join("");
    case "snake":
      return words.join("_");
    case "constant":
      return words.join("_").toUpperCase();
    case "kebab":
      return words.join("-");
    case "dot":
      return words.join(".");
    case "title":
      return words.map(cap).join(" ");
    case "sentence":
      return words.map((w, i) => (i === 0 ? cap(w) : w)).join(" ");
    case "lower":
      return words.join(" ");
    case "upper":
      return words.join(" ").toUpperCase();
  }
}

/** Converts the input to the given case, line by line. Empty input -> "". */
export function toCase(input: string, style: CaseStyle): string {
  if (!input.trim()) return "";
  return input.split("\n").map((line) => convertLine(line, style)).join("\n");
}
