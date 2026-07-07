import { parse as llParse, stringify as llStringify, isLosslessNumber } from "lossless-json";

export interface JsonError {
  message: string;
  line: number;
  column: number;
  position: number;
  suggestion?: string;
}

// A container is a plain object or array — but NOT a LosslessNumber, which is an
// object instance we treat as a numeric leaf so precision is never lost.
function isContainer(v: unknown): v is Record<string, unknown> | unknown[] {
  return v !== null && typeof v === "object" && !isLosslessNumber(v);
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: JsonError };

function computeLineCol(raw: string, position: number): { line: number; column: number } {
  let line = 1;
  let col = 1;
  const limit = Math.max(0, Math.min(position, raw.length));
  for (let i = 0; i < limit; i++) {
    if (raw[i] === "\n") {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  return { line, column: col };
}

function parseSyntaxError(raw: string, err: unknown): JsonError {
  const msg = err instanceof Error ? err.message : String(err);
  const posMatch = msg.match(/position (\d+)/i);
  const lineMatch = msg.match(/line (\d+) column (\d+)/i);
  let line = 1;
  let column = 1;
  let position = 0;
  if (posMatch) {
    position = parseInt(posMatch[1], 10);
    const lc = computeLineCol(raw, position);
    line = lc.line;
    column = lc.column;
  } else if (lineMatch) {
    line = parseInt(lineMatch[1], 10);
    column = parseInt(lineMatch[2], 10);
  }
  const suggestion = suggestFix(raw);
  return { message: msg.replace(/in JSON.*$/, "").trim() || "Invalid JSON", line, column, position, suggestion };
}

export function validate(raw: string): Result<true> {
  if (!raw.trim()) {
    return {
      ok: false,
      error: { message: "No input to validate", line: 1, column: 1, position: 0 },
    };
  }
  try {
    JSON.parse(raw);
    return { ok: true, value: true };
  } catch (e) {
    return { ok: false, error: parseSyntaxError(raw, e) };
  }
}

export function format(raw: string, indent: 2 | 4 = 2): Result<string> {
  const v = validate(raw);
  if (!v.ok) return v;
  // Lossless parse/stringify so large integers and high-precision decimals are
  // preserved exactly rather than coerced through IEEE-754 doubles.
  try {
    return { ok: true, value: llStringify(llParse(raw), null, indent) as string };
  } catch (e) {
    return { ok: false, error: parseSyntaxError(raw, e) };
  }
}

export function minify(raw: string): Result<string> {
  const v = validate(raw);
  if (!v.ok) return v;
  try {
    return { ok: true, value: llStringify(llParse(raw)) as string };
  } catch (e) {
    return { ok: false, error: parseSyntaxError(raw, e) };
  }
}

function suggestFix(raw: string): string | undefined {
  if (!raw.trim()) return undefined;
  if (/,\s*[\]}]/.test(raw)) return "Trailing comma detected — JSON doesn't allow commas before } or ].";
  if (/[{,]\s*['"]?[A-Za-z_$][\w$]*['"]?\s*:/.test(raw) && /[{,]\s*[A-Za-z_$][\w$]*\s*:/.test(raw))
    return "Object keys must be wrapped in double quotes (e.g. \"key\": value).";
  if (/'[^']*'\s*[:,}\]]/.test(raw)) return "Strings must use double quotes, not single quotes.";
  if (/\/\/|\/\*/.test(raw)) return "JSON doesn't support comments — remove // or /* */ segments.";
  if (/\bundefined\b/.test(raw)) return "JSON has no `undefined` — use null instead.";
  const openCurly = (raw.match(/{/g) || []).length;
  const closeCurly = (raw.match(/}/g) || []).length;
  if (openCurly !== closeCurly) return `Unbalanced braces — ${openCurly} "{" vs ${closeCurly} "}".`;
  const openBr = (raw.match(/\[/g) || []).length;
  const closeBr = (raw.match(/\]/g) || []).length;
  if (openBr !== closeBr) return `Unbalanced brackets — ${openBr} "[" vs ${closeBr} "]".`;
  return undefined;
}

/* ------- CSV ------- */
function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (isLosslessNumber(value)) return String(value);
  const s = isContainer(value) ? (llStringify(value) as string) : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV(raw: string): Result<string> {
  const v = validate(raw);
  if (!v.ok) return v;
  const parsed = llParse(raw);
  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      error: {
        message: "CSV export expects a top-level array of objects",
        line: 1,
        column: 1,
        position: 0,
      },
    };
  }
  if (parsed.length === 0) return { ok: true, value: "" };
  const headers: string[] = Array.from(
    (parsed as unknown[]).reduce((set: Set<string>, item: unknown) => {
      if (item && typeof item === "object" && !Array.isArray(item) && !isLosslessNumber(item)) {
        Object.keys(item as object).forEach((k) => set.add(k));
      }
      return set;
    }, new Set<string>())
  );
  if (headers.length === 0) {
    // Array of primitives
    return { ok: true, value: parsed.map((p: unknown) => escapeCsv(p)).join("\n") };
  }
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of parsed as Record<string, unknown>[]) {
    lines.push(headers.map((h) => escapeCsv(row?.[h as string])).join(","));
  }
  return { ok: true, value: lines.join("\n") };
}

/* ------- TypeScript ------- */
type TsType =
  | { kind: "primitive"; name: "string" | "number" | "boolean" | "null" | "unknown" }
  | { kind: "array"; of: TsType }
  | { kind: "object"; name: string; fields: { key: string; type: TsType; optional: boolean }[] }
  | { kind: "union"; of: TsType[] };

function pascalCase(s: string): string {
  return s
    .replace(/[^A-Za-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("") || "Item";
}

function singularize(name: string): string {
  if (/ies$/.test(name)) return name.replace(/ies$/, "y");
  if (/ses$/.test(name)) return name.replace(/es$/, "");
  if (/s$/.test(name) && !/ss$/.test(name)) return name.replace(/s$/, "");
  return name + "Item";
}

function typesEqual(a: TsType, b: TsType): boolean {
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}
function normalize(t: TsType): unknown {
  if (t.kind === "object") {
    return { kind: "object", fields: t.fields.map((f) => ({ key: f.key, type: normalize(f.type), optional: f.optional })) };
  }
  if (t.kind === "array") return { kind: "array", of: normalize(t.of) };
  if (t.kind === "union") return { kind: "union", of: t.of.map(normalize) };
  return t;
}

function mergeTypes(types: TsType[]): TsType {
  const unique: TsType[] = [];
  for (const t of types) if (!unique.some((u) => typesEqual(u, t))) unique.push(t);
  if (unique.length === 1) return unique[0];
  // Merge objects if all unique are objects
  if (unique.every((u) => u.kind === "object")) {
    const merged = mergeObjects(unique as Extract<TsType, { kind: "object" }>[]);
    return merged;
  }
  return { kind: "union", of: unique };
}

function mergeObjects(objs: Extract<TsType, { kind: "object" }>[]): TsType {
  const keyMap = new Map<string, { types: TsType[]; seenIn: number }>();
  objs.forEach((o) => {
    o.fields.forEach((f) => {
      const entry = keyMap.get(f.key) ?? { types: [], seenIn: 0 };
      entry.types.push(f.type);
      entry.seenIn++;
      keyMap.set(f.key, entry);
    });
  });
  const total = objs.length;
  const fields = Array.from(keyMap.entries()).map(([key, { types, seenIn }]) => ({
    key,
    type: mergeTypes(types),
    optional: seenIn < total,
  }));
  return { kind: "object", name: objs[0].name, fields };
}

function inferType(value: unknown, hint: string, interfaces: Map<string, Extract<TsType, { kind: "object" }>>): TsType {
  if (value === null) return { kind: "primitive", name: "null" };
  if (isLosslessNumber(value)) return { kind: "primitive", name: "number" };
  if (typeof value === "string") return { kind: "primitive", name: "string" };
  if (typeof value === "number") return { kind: "primitive", name: "number" };
  if (typeof value === "boolean") return { kind: "primitive", name: "boolean" };
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: "array", of: { kind: "primitive", name: "unknown" } };
    const itemHint = singularize(pascalCase(hint));
    const itemTypes = value.map((v) => inferType(v, itemHint, interfaces));
    return { kind: "array", of: mergeTypes(itemTypes) };
  }
  if (typeof value === "object") {
    const name = uniqueInterfaceName(pascalCase(hint), interfaces);
    const fields = Object.entries(value as Record<string, unknown>).map(([k, v]) => ({
      key: k,
      type: inferType(v, k, interfaces),
      optional: v === null || v === undefined,
    }));
    const obj: Extract<TsType, { kind: "object" }> = { kind: "object", name, fields };
    interfaces.set(name, obj);
    return obj;
  }
  return { kind: "primitive", name: "unknown" };
}

function uniqueInterfaceName(base: string, interfaces: Map<string, unknown>): string {
  if (!interfaces.has(base)) return base;
  let i = 2;
  while (interfaces.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

function renderTsType(t: TsType): string {
  switch (t.kind) {
    case "primitive":
      return t.name;
    case "array":
      return renderTsType(t.of).includes(" | ") ? `(${renderTsType(t.of)})[]` : `${renderTsType(t.of)}[]`;
    case "object":
      return t.name;
    case "union":
      return t.of.map(renderTsType).join(" | ");
  }
}

function isIdentifier(key: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
}

export function toTypeScript(raw: string, rootName = "Root"): Result<string> {
  const v = validate(raw);
  if (!v.ok) return v;
  const parsed = llParse(raw);
  const interfaces = new Map<string, Extract<TsType, { kind: "object" }>>();
  const rootType = inferType(parsed, rootName, interfaces);

  // Collect and dedupe interfaces — simple approach: render each once in insertion order
  const out: string[] = [];
  if (rootType.kind !== "object" && rootType.kind !== "array") {
    out.push(`export type ${rootName} = ${renderTsType(rootType)};`);
  } else if (rootType.kind === "array") {
    out.push(`export type ${rootName} = ${renderTsType(rootType)};`);
  }
  // Render each collected interface
  for (const obj of Array.from(interfaces.values())) {
    const lines = obj.fields.map((f) => {
      const key = isIdentifier(f.key) ? f.key : JSON.stringify(f.key);
      return `  ${key}${f.optional ? "?" : ""}: ${renderTsType(f.type)};`;
    });
    out.push(`export interface ${obj.name} {\n${lines.join("\n")}\n}`);
  }
  return { ok: true, value: out.join("\n\n") };
}

/* ------- YAML ------- */
function needsQuote(s: string): boolean {
  if (s === "") return true;
  if (/^[\s-?:,\[\]{}#&*!|>'"%@`]/.test(s)) return true;
  if (/[\s:#]$/.test(s)) return true;
  if (/^(true|false|null|yes|no|on|off|~)$/i.test(s)) return true;
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s)) return true;
  if (/[:#]\s|\s#/.test(s)) return true;
  if (/[\n\t\r"]/.test(s)) return true;
  return false;
}

function yamlString(s: string): string {
  if (!needsQuote(s)) return s;
  const escaped = s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/\r/g, "\\r");
  return `"${escaped}"`;
}

function yamlValue(value: unknown, indent: number): string {
  const pad = "  ".repeat(indent);
  if (value === null) return "null";
  if (isLosslessNumber(value)) return value.toString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return ".nan";
    return String(value);
  }
  if (typeof value === "string") return yamlString(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        if (isContainer(item)) {
          const rendered = yamlValue(item, indent + 1);
          if (Array.isArray(item)) {
            return `${pad}-\n${rendered}`;
          }
          // Inline first key after dash
          const rlines = rendered.split("\n");
          const firstLinePad = "  ".repeat(indent + 1);
          if (rlines[0].startsWith(firstLinePad)) {
            rlines[0] = `${pad}- ${rlines[0].slice(firstLinePad.length)}`;
          } else {
            rlines.unshift(`${pad}-`);
          }
          return rlines.join("\n");
        }
        return `${pad}- ${yamlValue(item, indent + 1)}`;
      })
      .join("\n");
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return entries
      .map(([k, v]) => {
        const key = yamlString(k);
        if (isContainer(v)) {
          if (Array.isArray(v) && v.length === 0) return `${pad}${key}: []`;
          if (!Array.isArray(v) && Object.keys(v as object).length === 0) return `${pad}${key}: {}`;
          return `${pad}${key}:\n${yamlValue(v, indent + 1)}`;
        }
        return `${pad}${key}: ${yamlValue(v, indent + 1)}`;
      })
      .join("\n");
  }
  return "null";
}

export function toYAML(raw: string): Result<string> {
  const v = validate(raw);
  if (!v.ok) return v;
  const parsed = llParse(raw);
  return { ok: true, value: yamlValue(parsed, 0) + "\n" };
}

/* ------- Highlight tokenizer ------- */
export type TokenKind = "key" | "string" | "number" | "bool" | "null" | "punct" | "brace" | "ws";
export interface Token {
  kind: TokenKind;
  value: string;
}

export function tokenize(formatted: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = formatted.length;
  while (i < n) {
    const c = formatted[i];
    if (c === '"') {
      const start = i++;
      while (i < n) {
        if (formatted[i] === "\\") {
          i += 2;
          continue;
        }
        if (formatted[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      const value = formatted.slice(start, i);
      // Key if followed (after whitespace) by ':'
      let j = i;
      while (j < n && /\s/.test(formatted[j])) j++;
      if (formatted[j] === ":") tokens.push({ kind: "key", value });
      else tokens.push({ kind: "string", value });
      continue;
    }
    if (c === "{" || c === "}" || c === "[" || c === "]") {
      tokens.push({ kind: "brace", value: c });
      i++;
      continue;
    }
    if (c === ":" || c === ",") {
      tokens.push({ kind: "punct", value: c });
      i++;
      continue;
    }
    if (/\s/.test(c)) {
      let s = "";
      while (i < n && /\s/.test(formatted[i])) s += formatted[i++];
      tokens.push({ kind: "ws", value: s });
      continue;
    }
    if (c === "-" || /[0-9]/.test(c)) {
      let s = "";
      while (i < n && /[0-9.eE+\-]/.test(formatted[i])) s += formatted[i++];
      tokens.push({ kind: "number", value: s });
      continue;
    }
    if (formatted.startsWith("true", i) || formatted.startsWith("false", i)) {
      const m = formatted.startsWith("true", i) ? "true" : "false";
      tokens.push({ kind: "bool", value: m });
      i += m.length;
      continue;
    }
    if (formatted.startsWith("null", i)) {
      tokens.push({ kind: "null", value: "null" });
      i += 4;
      continue;
    }
    // Unknown char, skip
    i++;
  }
  return tokens;
}

/* ------- Sort keys ------- */
export function sortKeys(raw: string, indent: 2 | 4 = 2): Result<string> {
  const v = validate(raw);
  if (!v.ok) return v;
  const parsed = llParse(raw);
  function walk(node: unknown): unknown {
    if (Array.isArray(node)) return node.map(walk);
    if (isContainer(node)) {
      const keys = Object.keys(node as Record<string, unknown>).sort();
      const out: Record<string, unknown> = {};
      for (const k of keys) out[k] = walk((node as Record<string, unknown>)[k]);
      return out;
    }
    return node;
  }
  return { ok: true, value: llStringify(walk(parsed), null, indent) as string };
}

/* ------- Stats ------- */
export interface JsonStats {
  bytes: number;
  bytesMin: number;
  depth: number;
  totalKeys: number;
  arrays: number;
  objects: number;
  types: { string: number; number: number; boolean: number; null: number };
}

export function computeStats(raw: string): JsonStats | null {
  if (!raw.trim()) return null;
  try {
    const parsed = llParse(raw);
    const min = llStringify(parsed) as string;
    const s: JsonStats = {
      bytes: new Blob([raw]).size,
      bytesMin: new Blob([min]).size,
      depth: 0,
      totalKeys: 0,
      arrays: 0,
      objects: 0,
      types: { string: 0, number: 0, boolean: 0, null: 0 },
    };
    const walk = (node: unknown, depth: number): void => {
      if (depth > s.depth) s.depth = depth;
      if (node === null) s.types.null++;
      else if (isLosslessNumber(node)) s.types.number++;
      else if (Array.isArray(node)) {
        s.arrays++;
        node.forEach((child) => walk(child, depth + 1));
      } else if (typeof node === "object") {
        s.objects++;
        const entries = Object.entries(node as Record<string, unknown>);
        s.totalKeys += entries.length;
        entries.forEach(([, v]) => walk(v, depth + 1));
      } else if (typeof node === "string") s.types.string++;
      else if (typeof node === "number") s.types.number++;
      else if (typeof node === "boolean") s.types.boolean++;
    };
    walk(parsed, 1);
    return s;
  } catch {
    return null;
  }
}

/* ------- JSON -> XML ------- */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function sanitizeTag(s: string): string {
  return /^[A-Za-z_][\w.-]*$/.test(s) ? s : "item";
}

export function toXML(raw: string, rootTag = "root"): Result<string> {
  const v = validate(raw);
  if (!v.ok) return v;
  const parsed = llParse(raw);
  function render(node: unknown, tag: string, indent: number): string {
    const pad = "  ".repeat(indent);
    if (node === null) return `${pad}<${tag} nil="true"/>`;
    if (isLosslessNumber(node)) return `${pad}<${tag}>${node.toString()}</${tag}>`;
    if (Array.isArray(node)) {
      const itemTag = sanitizeTag(
        tag.endsWith("s") && tag.length > 1 ? tag.slice(0, -1) : `${tag}Item`
      );
      return node.map((item) => render(item, itemTag, indent)).join("\n");
    }
    if (typeof node === "object") {
      const entries = Object.entries(node as Record<string, unknown>);
      if (entries.length === 0) return `${pad}<${tag}/>`;
      const inner = entries
        .map(([k, v]) => render(v, sanitizeTag(k), indent + 1))
        .join("\n");
      return `${pad}<${tag}>\n${inner}\n${pad}</${tag}>`;
    }
    return `${pad}<${tag}>${escapeXml(String(node))}</${tag}>`;
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${render(parsed, sanitizeTag(rootTag), 0)}`;
  return { ok: true, value: xml };
}

/* ------- JSON -> Query string ------- */
export function toQueryString(raw: string): Result<string> {
  const v = validate(raw);
  if (!v.ok) return v;
  const parsed = llParse(raw);
  if (!isContainer(parsed) || Array.isArray(parsed)) {
    return {
      ok: false,
      error: {
        message: "Query-string export expects a flat or nested object",
        line: 1,
        column: 1,
        position: 0,
      },
    };
  }
  const parts: string[] = [];
  function walk(node: unknown, prefix: string) {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${prefix}[${i}]`));
    } else if (isContainer(node)) {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        walk(v, prefix ? `${prefix}[${k}]` : k);
      }
    } else {
      parts.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(node))}`);
    }
  }
  walk(parsed, "");
  return { ok: true, value: parts.join("&") };
}

/* ------- Escape for code embedding ------- */
export type EscapeLang = "javascript" | "python" | "go" | "rust" | "shell" | "sql" | "java";

// A Rust raw string r#"..."# closes at the first '"' followed by the same number
// of '#'. Pick a hash count one greater than the longest run of '#' that follows
// a '"' in the body, so the delimiter can never collide with the content.
function rustRawString(body: string): string {
  let maxRun = 0;
  const re = /"(#+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (m[1].length > maxRun) maxRun = m[1].length;
  }
  const h = "#".repeat(maxRun + 1);
  return `r${h}"${body}"${h}`;
}

export function escapeForCode(raw: string, lang: EscapeLang): string {
  const minified = (() => {
    try {
      return llStringify(llParse(raw)) as string;
    } catch {
      return raw;
    }
  })();

  switch (lang) {
    case "javascript":
      // Escape backticks and template literal expressions for safety in template strings
      return "`" + minified.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${") + "`";
    case "python":
      return "'''" + minified.replace(/'''/g, "'\\''") + "'''";
    case "go":
      return "`" + minified.replace(/`/g, "` + \"`\" + `") + "`";
    case "rust":
      return rustRawString(minified);
    case "shell":
      return "'" + minified.replace(/'/g, "'\\''") + "'";
    case "sql":
      return "'" + minified.replace(/'/g, "''") + "'";
    case "java":
      return '"' + minified.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  }
}

/* ------- Diff (line by line, for formatted JSONs) ------- */
export type DiffRow = { type: "same" | "add" | "del"; a?: string; b?: string; aLine?: number; bLine?: number };

// Above this many lines per side the full LCS matrix ((n+1)*(m+1) numbers) is
// too large to build without freezing the tab, so we fall back to a fast
// prefix/suffix diff.
const DIFF_LCS_LIMIT = 2500;

export function diffLines(aText: string, bText: string): DiffRow[] {
  const a = aText.split("\n");
  const b = bText.split("\n");
  const n = a.length;
  const m = b.length;
  if (n > DIFF_LCS_LIMIT || m > DIFF_LCS_LIMIT) return fastDiff(a, b);
  // Longest common subsequence matrix (O(n*m) — fine for typical JSON sizes)
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rows.push({ type: "same", a: a[i], b: b[j], aLine: i + 1, bLine: j + 1 });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: "del", a: a[i], aLine: i + 1 });
      i++;
    } else {
      rows.push({ type: "add", b: b[j], bLine: j + 1 });
      j++;
    }
  }
  while (i < n) {
    rows.push({ type: "del", a: a[i], aLine: i + 1 });
    i++;
  }
  while (j < m) {
    rows.push({ type: "add", b: b[j], bLine: j + 1 });
    j++;
  }
  return rows;
}

// Linear-time coarse diff for very large inputs: keep the common prefix and
// suffix as unchanged, show the differing middle as a delete block then an add
// block. Not a minimal edit script, but it never freezes the tab.
function fastDiff(a: string[], b: string[]): DiffRow[] {
  const rows: DiffRow[] = [];
  const minLen = Math.min(a.length, b.length);
  let start = 0;
  while (start < minLen && a[start] === b[start]) start++;
  let endA = a.length - 1;
  let endB = b.length - 1;
  while (endA >= start && endB >= start && a[endA] === b[endB]) {
    endA--;
    endB--;
  }
  for (let i = 0; i < start; i++) rows.push({ type: "same", a: a[i], b: b[i], aLine: i + 1, bLine: i + 1 });
  for (let i = start; i <= endA; i++) rows.push({ type: "del", a: a[i], aLine: i + 1 });
  for (let j = start; j <= endB; j++) rows.push({ type: "add", b: b[j], bLine: j + 1 });
  for (let i = endA + 1, j = endB + 1; i < a.length && j < b.length; i++, j++) {
    rows.push({ type: "same", a: a[i], b: b[j], aLine: i + 1, bLine: j + 1 });
  }
  return rows;
}

/* ------- Parse JSON5 safely ------- */
import JSON5 from "json5";

export function parseJson5Compat(raw: string, indent: 2 | 4 = 2): Result<string> {
  if (!raw.trim()) return { ok: false, error: { message: "Empty input", line: 1, column: 1, position: 0 } };
  try {
    // Strict JSON path: lossless so numbers survive and indentation is generated
    // by the serializer (never by a whitespace regex, which mangles string data).
    return { ok: true, value: llStringify(llParse(raw), null, indent) as string };
  } catch {
    try {
      const parsed = JSON5.parse(raw);
      return { ok: true, value: JSON.stringify(parsed, null, indent) };
    } catch (e) {
      return parseJson5Error(raw, e);
    }
  }
}

function parseJson5Error(raw: string, err: unknown): Result<string> {
  const msg = err instanceof Error ? err.message : String(err);
  const lineMatch = msg.match(/at (\d+):(\d+)/);
  const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;
  const column = lineMatch ? parseInt(lineMatch[2], 10) : 1;
  return {
    ok: false,
    error: { message: msg, line, column, position: 0, suggestion: undefined },
  };
}

/* ------- Gzip size (async) ------- */
export async function gzipSize(text: string): Promise<number | null> {
  if (typeof CompressionStream === "undefined") return null;
  try {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
    const buf = await new Response(stream).arrayBuffer();
    return buf.byteLength;
  } catch {
    return null;
  }
}

export const SAMPLE_JSON = `{
  "user": {
    "id": "usr_8f4k3j2h9",
    "name": "Ada Lovelace",
    "email": "ada@codercops.com",
    "verified": true,
    "age": 36,
    "balance": 2580.75,
    "roles": ["admin", "maintainer"],
    "preferences": {
      "theme": "dark",
      "notifications": { "email": true, "push": false, "digest": "weekly" },
      "timezone": "UTC"
    },
    "address": null,
    "projects": [
      { "id": 1, "name": "Atlas", "active": true },
      { "id": 2, "name": "Beacon", "active": false }
    ]
  },
  "meta": { "version": "1.4.0", "generatedAt": "2026-04-15T10:00:00Z" }
}`;
