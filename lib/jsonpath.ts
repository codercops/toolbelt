import { JSONPath } from "jsonpath-plus";

export interface JsonPathResult {
  ok: boolean;
  matches: unknown[];
  paths: string[];
  error?: string;
}

export function runJsonPath(raw: string, path: string): JsonPathResult {
  if (!raw.trim()) return { ok: false, matches: [], paths: [], error: "Paste JSON first" };
  if (!path.trim()) return { ok: false, matches: [], paths: [], error: "Enter a JSONPath expression" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, matches: [], paths: [], error: `Invalid JSON: ${e instanceof Error ? e.message : "parse error"}` };
  }
  try {
    const result = JSONPath({
      path,
      json: parsed as object,
      resultType: "all",
      wrap: true,
    }) as { value: unknown; path: string }[];
    return {
      ok: true,
      matches: result.map((r) => r.value),
      paths: result.map((r) => r.path),
    };
  } catch (e) {
    return {
      ok: false,
      matches: [],
      paths: [],
      error: e instanceof Error ? e.message : "JSONPath evaluation failed",
    };
  }
}
