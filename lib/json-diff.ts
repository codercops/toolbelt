import { parse, stringify, LosslessNumber } from "lossless-json";
import { buildJsonTreePath, type JsonPathSegment } from "./json-tree-path";

export const DIFF_INPUT_LIMIT = 500_000;
export const DIFF_RESULT_LIMIT = 500;
export type JsonChange = { type: "Added" | "Removed" | "Changed"; path: string; before?: string; after?: string };

export function compareJson(original: string, updated: string, ignoreKeyOrder = true) {
  const errors: string[] = [];
  function read(text: string, name: string): unknown {
    if (text.length > DIFF_INPUT_LIMIT) {
      errors.push(`${name}: input exceeds ${DIFF_INPUT_LIMIT.toLocaleString("en-US")} characters.`);
      return undefined;
    }
    try { return parse(text); } catch { errors.push(`${name}: enter valid JSON.`); return undefined; }
  }
  const left = read(original, "Original JSON");
  const right = read(updated, "Updated JSON");
  const changes: JsonChange[] = [];
  let truncated = false;
  if (errors.length) return { errors, changes, truncated };
  const stack: { a: unknown; b: unknown; path: JsonPathSegment[]; kind?: "Added" | "Removed" }[] = [{ a: left, b: right, path: [] }];
  const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof LosslessNumber);
  while (stack.length) {
    const { a, b, path, kind } = stack.pop()!;
    if (!kind && a === b) continue;
    if (!kind && a instanceof LosslessNumber && b instanceof LosslessNumber && normalizeNumber(a.value) === normalizeNumber(b.value)) continue;
    if (!kind && Array.isArray(a) && Array.isArray(b)) {
      for (let i = Math.max(a.length, b.length) - 1; i >= 0; i--) stack.push({ a: a[i], b: b[i], path: [...path, { type: "index", index: i }], kind: i >= a.length ? "Added" : i >= b.length ? "Removed" : undefined });
      continue;
    }
    if (!kind && object(a) && object(b)) {
      const ak = Object.keys(a), bk = Object.keys(b);
      const sharedA = ak.filter(k => Object.hasOwn(b, k));
      const sharedB = bk.filter(k => Object.hasOwn(a, k));
      if (ignoreKeyOrder || sharedA.every((k, i) => k === sharedB[i])) {
        const keys = [...ak, ...bk.filter(k => !Object.hasOwn(a, k))];
        for (let i = keys.length - 1; i >= 0; i--) {
          const key = keys[i];
          stack.push({ a: a[key], b: b[key], path: [...path, { type: "property", key }], kind: !Object.hasOwn(a, key) ? "Added" : !Object.hasOwn(b, key) ? "Removed" : undefined });
        }
        continue;
      }
    }
    if (changes.length === DIFF_RESULT_LIMIT) { truncated = true; break; }
    changes.push({ type: kind ?? "Changed", path: buildJsonTreePath(path), ...(kind !== "Added" ? { before: stringify(a) } : {}), ...(kind !== "Removed" ? { after: stringify(b) } : {}) });
  }
  return { errors, changes, truncated };
}

// Canonical decimal representation without converting the coefficient to Number.
function normalizeNumber(value: string): string {
  const [coefficient, exponent = "0"] = value.toLowerCase().split("e");
  const negative = coefficient.startsWith("-");
  const unsigned = coefficient.replace(/^-/, "");
  const [integer, fraction = ""] = unsigned.split(".");
  let digits = (integer + fraction).replace(/^0+/, "");
  if (!digits) return "0";
  let power = BigInt(exponent) - BigInt(fraction.length);
  while (digits.endsWith("0")) { digits = digits.slice(0, -1); power += BigInt(1); }
  return `${negative ? "-" : ""}${digits}e${power}`;
}
