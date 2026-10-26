// CSV/TSV parsing, validation and conversion. Everything here is pure so it can
// be unit-tested without a DOM; the tool page is a thin wrapper around it.

export type CsvDelimiter = "," | ";" | "\t" | "|";
export type CsvLineEnding = "\n" | "\r\n" | "\r";

export type CsvIssueCode =
  | "unclosed-quote"
  | "unexpected-character"
  | "row-length"
  | "duplicate-header"
  | "empty-header"
  | "bom"
  | "mixed-line-endings"
  | "replacement-character"
  | "control-character"
  | "blank-lines"
  | "error-limit";

export interface CsvIssue {
  code: CsvIssueCode;
  message: string;
  /** 1-based line in the original input. */
  line: number;
  severity: "error" | "warning";
}

export interface ParseCsvOptions {
  /** `auto` (the default) sniffs the delimiter from the first records. */
  delimiter?: CsvDelimiter | "auto";
  /** Treat the first record as the header row. Defaults to true. */
  hasHeader?: boolean;
}

export interface ParsedCsv {
  /** Column names: the file header, or generated `column_1…` names. */
  header: string[];
  /** Data rows only (the header is not included). */
  rows: string[][];
  delimiter: CsvDelimiter;
  lineEnding: CsvLineEnding;
  mixedLineEndings: boolean;
  hadBom: boolean;
  blankLines: number;
  issues: CsvIssue[];
  errors: CsvIssue[];
  warnings: CsvIssue[];
  /** Number of data rows. */
  rowCount: number;
  /** Number of columns. */
  columnCount: number;
  /** True when there is nothing but whitespace in the input. */
  empty: boolean;
}

export interface FormatCsvOptions {
  delimiter?: CsvDelimiter;
  lineEnding?: CsvLineEnding;
}

export const DELIMITERS: { value: CsvDelimiter; label: string; short: string }[] = [
  { value: ",", label: "Comma", short: "," },
  { value: ";", label: "Semicolon", short: ";" },
  { value: "\t", label: "Tab", short: "Tab" },
  { value: "|", label: "Pipe", short: "|" },
];

export const MAX_REPORTED_ROW_ERRORS = 25;

const BOM = "\uFEFF";
const PLAIN_NUMBER_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const YAML_KEY_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;
// Plain YAML keys that a 1.1 parser reads as null or a boolean. They must be
// quoted, or `null: x` becomes `{None: "x"}` and `on: y` becomes `{True: "y"}`.
const YAML_RESERVED_KEYS = new Set([
  "null",
  "~",
  "true",
  "false",
  "yes",
  "no",
  "on",
  "off",
  "y",
  "n",
]);

export function delimiterLabel(delimiter: CsvDelimiter): string {
  return DELIMITERS.find((d) => d.value === delimiter)?.label ?? delimiter;
}

export function lineEndingLabel(lineEnding: CsvLineEnding): string {
  if (lineEnding === "\r\n") return "CRLF";
  if (lineEnding === "\r") return "CR";
  return "LF";
}

interface RawRecord {
  fields: string[];
  line: number;
}

interface TokenizeResult {
  records: RawRecord[];
  lineEndings: Set<CsvLineEnding>;
  errors: CsvIssue[];
  blankLines: number;
}

/**
 * Split CSV text into records. Quotes are only special at the start of a
 * field; a doubled quote inside a quoted field is a literal quote, and
 * newlines inside quotes belong to the field rather than the record.
 */
function tokenize(raw: string, delimiter: CsvDelimiter, maxRecords = Infinity): TokenizeResult {
  const records: RawRecord[] = [];
  const lineEndings = new Set<CsvLineEnding>();
  const errors: CsvIssue[] = [];
  let blankLines = 0;

  let fields: string[] = [];
  let field = "";
  let fieldStarted = false;
  let inQuotes = false;
  let quoteLine = 1;
  let line = 1;
  let recordLine = 1;

  function pushField() {
    fields.push(field);
    field = "";
    fieldStarted = false;
  }

  function pushRecord() {
    pushField();
    if (fields.length === 1 && fields[0] === "") {
      blankLines++;
    } else {
      records.push({ fields, line: recordLine });
    }
    fields = [];
  }

  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];

    if (inQuotes) {
      if (ch === '"') {
        if (raw[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        const next = raw[i + 1];
        if (next === undefined || next === delimiter || next === "\n" || next === "\r") {
          inQuotes = false;
          i++;
          continue;
        }
        errors.push({
          code: "unexpected-character",
          severity: "error",
          line,
          message: `Unexpected ${JSON.stringify(next)} after a closing quote on line ${line}. Quote the field or escape the quote by doubling it.`,
        });
        field += ch;
        i++;
        continue;
      }

      if (ch === "\r") {
        if (raw[i + 1] === "\n") {
          field += "\n";
          line++;
          i += 2;
          continue;
        }
        field += "\n";
        line++;
        i++;
        continue;
      }
      if (ch === "\n") {
        field += "\n";
        line++;
        i++;
        continue;
      }

      field += ch;
      i++;
      continue;
    }

    if (ch === '"' && field === "" && !fieldStarted) {
      inQuotes = true;
      fieldStarted = true;
      quoteLine = line;
      i++;
      continue;
    }

    if (ch === delimiter) {
      pushField();
      i++;
      continue;
    }

    if (ch === "\r" || ch === "\n") {
      let ending: CsvLineEnding = "\n";
      if (ch === "\r") {
        ending = raw[i + 1] === "\n" ? "\r\n" : "\r";
        if (ending === "\r\n") i++;
      }
      lineEndings.add(ending);
      pushRecord();
      line++;
      recordLine = line;
      i++;

      if (records.length >= maxRecords) {
        return { records, lineEndings, errors, blankLines };
      }
      continue;
    }

    field += ch;
    fieldStarted = true;
    i++;
  }

  if (inQuotes) {
    errors.push({
      code: "unclosed-quote",
      severity: "error",
      line: quoteLine,
      message: `A quoted field starting on line ${quoteLine} is never closed. Add the missing quote.`,
    });
  }

  // Only push a final record if the input did not end on a line break (or if
  // the last delimiter left an empty trailing field behind).
  if (fieldStarted || field !== "" || fields.length > 0) {
    pushRecord();
  }

  return { records, lineEndings, errors, blankLines };
}

/**
 * Pick the delimiter that splits the first records into the widest, most
 * consistent table. Ties prefer comma, then semicolon, tab, pipe.
 */
export function detectDelimiter(
  raw: string,
  candidates: CsvDelimiter[] = [",", ";", "\t", "|"],
): CsvDelimiter {
  const sample = raw.slice(0, 64 * 1024);
  let best: CsvDelimiter = ",";
  let bestScore = -1;

  for (const candidate of candidates) {
    const { records } = tokenize(sample, candidate, 50);
    if (records.length === 0) continue;

    const widths = records.map((record) => record.fields.length);
    const counts = new Map<number, number>();
    for (const width of widths) counts.set(width, (counts.get(width) ?? 0) + 1);

    let modalWidth = 1;
    let modalCount = 0;
    for (const [width, count] of counts) {
      if (count > modalCount || (count === modalCount && width > modalWidth)) {
        modalWidth = width;
        modalCount = count;
      }
    }

    if (modalWidth < 2) continue;

    const consistency = modalCount / widths.length;
    const score = consistency * 100 + Math.min(modalWidth, 20);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

function generatedHeader(columns: number): string[] {
  return Array.from({ length: columns }, (_, index) => `column_${index + 1}`);
}

/** Make column names unique without changing the first occurrence. */
export function uniqueHeaders(header: string[]): string[] {
  const seen = new Map<string, number>();
  return header.map((name, index) => {
    const base = name.trim() === "" ? `column_${index + 1}` : name;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

/**
 * Parse CSV/TSV text, detecting the delimiter and line ending, stripping a
 * UTF-8 BOM, and collecting validation errors and warnings.
 */
export function parseCsv(raw: string, options: ParseCsvOptions = {}): ParsedCsv {
  const hadBom = raw.startsWith(BOM);
  const text = hadBom ? raw.slice(1) : raw;
  const empty = text.trim() === "";
  const delimiter =
    !options.delimiter || options.delimiter === "auto" ? detectDelimiter(text) : options.delimiter;
  const hasHeader = options.hasHeader ?? true;

  if (empty) {
    return {
      header: [],
      rows: [],
      delimiter,
      lineEnding: "\n",
      mixedLineEndings: false,
      hadBom,
      blankLines: 0,
      issues: hadBom
        ? [
            {
              code: "bom",
              severity: "warning",
              line: 1,
              message: "A UTF-8 byte-order mark was found and ignored.",
            },
          ]
        : [],
      errors: [],
      warnings: [],
      rowCount: 0,
      columnCount: 0,
      empty: true,
    };
  }

  const { records, lineEndings, errors, blankLines } = tokenize(text, delimiter);
  const issues: CsvIssue[] = [...errors];

  if (hadBom) {
    issues.push({
      code: "bom",
      severity: "warning",
      line: 1,
      message: "A UTF-8 byte-order mark was found and removed.",
    });
  }

  if (lineEndings.size > 1) {
    issues.push({
      code: "mixed-line-endings",
      severity: "warning",
      line: 1,
      message: `Mixed line endings (${[...lineEndings].map(lineEndingLabel).join(", ")}). The output uses one consistent ending.`,
    });
  }

  const lineEnding: CsvLineEnding = lineEndings.size > 0 ? [...lineEndings][0] : "\n";
  const mixedLineEndings = lineEndings.size > 1;

  if (text.includes("\uFFFD")) {
    issues.push({
      code: "replacement-character",
      severity: "warning",
      line: 1,
      message:
        "The input contains U+FFFD (the replacement character), which usually means the file was decoded with the wrong encoding.",
    });
  }

  const controlMatch = text.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/);
  if (controlMatch && controlMatch[0] !== "\uFEFF") {
    issues.push({
      code: "control-character",
      severity: "warning",
      line: 1,
      message:
        "The input contains control characters (such as NUL or ESC) that are not valid in CSV text and may break other tools.",
    });
  }

  if (blankLines > 0) {
    issues.push({
      code: "blank-lines",
      severity: "warning",
      line: 1,
      message: `${blankLines} blank ${blankLines === 1 ? "line was" : "lines were"} skipped.`,
    });
  }

  let header: string[];
  let dataRecords: RawRecord[];

  if (hasHeader) {
    header = records.length > 0 ? records[0].fields : [];
    dataRecords = records.slice(1);
  } else {
    const columns = records.length > 0 ? records[0].fields.length : 0;
    header = generatedHeader(columns);
    dataRecords = records;
  }

  const columnCount = header.length;

  if (hasHeader && records.length > 0) {
    const seen = new Set<string>();
    header.forEach((name, index) => {
      const trimmed = name.trim();
      if (trimmed === "") {
        issues.push({
          code: "empty-header",
          severity: "warning",
          line: records[0].line,
          message: `Column ${index + 1} has an empty header. It will be exported as column_${index + 1}.`,
        });
      }
      if (trimmed !== "" && seen.has(trimmed)) {
        issues.push({
          code: "duplicate-header",
          severity: "warning",
          line: records[0].line,
          message: `The header ${JSON.stringify(trimmed)} appears more than once. Later copies get a numeric suffix when converting.`,
        });
      }
      if (trimmed !== "") seen.add(trimmed);
    });
  }

  const rows = dataRecords.map((record) => record.fields);
  let rowErrors = 0;

  dataRecords.forEach((record) => {
    if (record.fields.length === columnCount) return;
    rowErrors++;
    if (rowErrors > MAX_REPORTED_ROW_ERRORS) return;
    issues.push({
      code: "row-length",
      severity: "error",
      line: record.line,
      message: `Line ${record.line} has ${record.fields.length} ${record.fields.length === 1 ? "column" : "columns"} but the header has ${columnCount}.`,
    });
  });

  if (rowErrors > MAX_REPORTED_ROW_ERRORS) {
    issues.push({
      code: "error-limit",
      severity: "error",
      line: 1,
      message: `…and ${rowErrors - MAX_REPORTED_ROW_ERRORS} more rows with the wrong number of columns.`,
    });
  }

  const errorList = issues.filter((issue) => issue.severity === "error");
  const warningList = issues.filter((issue) => issue.severity === "warning");

  return {
    header,
    rows,
    delimiter,
    lineEnding,
    mixedLineEndings,
    hadBom,
    blankLines,
    issues,
    errors: errorList,
    warnings: warningList,
    rowCount: rows.length,
    columnCount,
    empty: false,
  };
}

/** Pad or trim a row so conversions always line up with the header. */
function normalizeRow(row: string[], columns: number): string[] {
  if (row.length === columns) return row;
  if (row.length < columns) return [...row, ...Array<string>(columns - row.length).fill("")];
  return row.slice(0, columns);
}

function escapeCsvField(value: string, delimiter: CsvDelimiter): string {
  if (
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serialize a table back to CSV, quoting only the fields that need it. */
export function formatCsv(
  header: string[],
  rows: string[][],
  options: FormatCsvOptions = {},
): string {
  const delimiter = options.delimiter ?? ",";
  const lineEnding = options.lineEnding ?? "\n";
  const lines = [header, ...rows].map((row) =>
    normalizeRow(row, header.length)
      .map((field) => escapeCsvField(field, delimiter))
      .join(delimiter),
  );
  return lines.join(lineEnding);
}

/** Convert to a JSON array of objects, keeping every value as a string. */
export function csvToJson(header: string[], rows: string[][]): Record<string, string>[] {
  const keys = uniqueHeaders(header);
  return rows.map((row) => {
    const normalized = normalizeRow(row, keys.length);
    const object: Record<string, string> = {};
    keys.forEach((key, index) => {
      object[key] = normalized[index] ?? "";
    });
    return object;
  });
}

function tsProperty(name: string): string {
  return IDENTIFIER_RE.test(name) ? name : JSON.stringify(name);
}

/**
 * Build a TypeScript interface describing the JSON output. Every CSV value is
 * text and the JSON array keeps it that way, so every field is `string` — a
 * narrower guess (`number` for "007") would describe values the JSON does not
 * contain.
 */
export function csvToTypeScript(header: string[], typeName = "Row"): string {
  const keys = uniqueHeaders(header);
  const name = IDENTIFIER_RE.test(typeName) ? typeName : "Row";

  if (keys.length === 0) return `export interface ${name} {}`;

  const fields = keys.map((key) => `  ${tsProperty(key)}: string;`);

  return `export interface ${name} {\n${fields.join("\n")}\n}`;
}

function yamlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r")}"`;
}

function yamlKey(key: string): string {
  if (YAML_KEY_RE.test(key) && !YAML_RESERVED_KEYS.has(key.toLowerCase())) return key;
  return yamlString(key);
}

/** Convert to a YAML sequence of mappings. Values stay quoted strings. */
export function csvToYaml(header: string[], rows: string[][]): string {
  if (rows.length === 0) return "[]";
  const keys = uniqueHeaders(header);

  return rows
    .map((row) => {
      const normalized = normalizeRow(row, keys.length);
      return keys
        .map((key, index) => {
          const prefix = index === 0 ? "- " : "  ";
          return `${prefix}${yamlKey(key)}: ${yamlString(normalized[index] ?? "")}`;
        })
        .join("\n");
    })
    .join("\n");
}

function sqlIdentifier(name: string): string {
  return `\`${name.replace(/`/g, "``")}\``;
}

function sqlValue(value: string): string {
  if (value === "") return "NULL";
  // Only bare numbers that round-trip as numbers. Leading zeros ("007") and a
  // leading plus ("+1555…") would be silently changed, so they stay quoted.
  if (PLAIN_NUMBER_RE.test(value.trim())) return value.trim();
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

/** Convert to one INSERT per row, using MySQL-style backtick identifiers. */
export function csvToSql(header: string[], rows: string[][], tableName = "records"): string {
  if (header.length === 0) return "";
  const keys = uniqueHeaders(header);
  const table = sqlIdentifier(tableName.trim() || "records");
  const columns = keys.map(sqlIdentifier).join(", ");

  return rows
    .map((row) => {
      const normalized = normalizeRow(row, keys.length);
      const values = normalized.map(sqlValue).join(", ");
      return `INSERT INTO ${table} (${columns}) VALUES (${values});`;
    })
    .join("\n");
}

/** Align columns with padding so the table is readable in a monospace view. */
export function prettifyCsv(header: string[], rows: string[][]): string {
  if (header.length === 0) return "";
  const widths = header.map((name, index) => {
    const dataWidth = rows.reduce(
      (max, row) => Math.max(max, (row[index] ?? "").length),
      0,
    );
    return Math.max(name.length, dataWidth);
  });

  const formatRow = (row: string[]) =>
    normalizeRow(row, header.length)
      .map((field, index) => field.padEnd(widths[index]))
      .join(" | ")
      .trimEnd();

  const separator = widths.map((width) => "-".repeat(width)).join("-+-");
  return [formatRow(header), separator, ...rows.map(formatRow)].join("\n");
}

/** Byte size of the input, used for the stats bar. */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export const SAMPLE_CSV = `name,role,location,joined,active
Ada Lovelace,Engineer,London,1843-01-01,true
Grace Hopper,Admiral,New York,1944-06-01,true
"Katherine Johnson",Mathematician,"White Sulphur Springs, WV",1953-06-01,false
"Margaret Hamilton",Engineer,Boston,1960-08-01,true`;
