import { describe, expect, it } from "vitest";
import {
  csvToJson,
  csvToSql,
  csvToTypeScript,
  csvToYaml,
  delimiterLabel,
  detectDelimiter,
  formatCsv,
  parseCsv,
  prettifyCsv,
  uniqueHeaders,
} from "../csv-utils";

describe("detectDelimiter", () => {
  it("detects commas", () => {
    expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",");
  });

  it("detects semicolons", () => {
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
  });

  it("detects tabs", () => {
    expect(detectDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
  });

  it("detects pipes", () => {
    expect(detectDelimiter("a|b|c\n1|2|3")).toBe("|");
  });

  it("ignores delimiters inside quoted fields", () => {
    expect(detectDelimiter('"a;b";c\n"1;2";3')).toBe(";");
  });

  it("falls back to comma for single-column input", () => {
    expect(detectDelimiter("one\ntwo\nthree")).toBe(",");
  });
});

describe("parseCsv", () => {
  it("splits the header and data rows", () => {
    const parsed = parseCsv("name,age\nAda,36\nGrace,85");
    expect(parsed.header).toEqual(["name", "age"]);
    expect(parsed.rows).toEqual([
      ["Ada", "36"],
      ["Grace", "85"],
    ]);
    expect(parsed.rowCount).toBe(2);
    expect(parsed.columnCount).toBe(2);
    expect(parsed.errors).toEqual([]);
  });

  it("keeps delimiters inside quoted fields", () => {
    const parsed = parseCsv('name,note\nAda,"likes, commas"');
    expect(parsed.rows).toEqual([["Ada", "likes, commas"]]);
  });

  it("unescapes doubled quotes", () => {
    const parsed = parseCsv('quote\n"She said ""hi"""');
    expect(parsed.rows).toEqual([['She said "hi"']]);
  });

  it("keeps newlines inside quoted fields and tracks row lines", () => {
    const parsed = parseCsv('id,note\n1,"line one\nline two"\n2,plain');
    expect(parsed.rows).toEqual([
      ["1", "line one\nline two"],
      ["2", "plain"],
    ]);
    expect(parsed.errors).toEqual([]);
  });

  it("reports an unclosed quoted field with its starting line", () => {
    const parsed = parseCsv('id,note\n1,"never closed');
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0].code).toBe("unclosed-quote");
    expect(parsed.errors[0].line).toBe(2);
  });

  it("reports rows with the wrong number of columns, with line numbers", () => {
    const parsed = parseCsv("a,b,c\n1,2,3\n4,5\n6,7,8,9");
    expect(parsed.errors.map((error) => error.line)).toEqual([3, 4]);
    expect(parsed.errors[0].message).toContain("2 columns");
    expect(parsed.rows[1]).toEqual(["4", "5"]);
  });

  it("skips blank lines and says so", () => {
    const parsed = parseCsv("a,b\n1,2\n\n3,4\n");
    expect(parsed.rows).toEqual([
      ["1", "2"],
      ["3", "4"],
    ]);
    expect(parsed.blankLines).toBe(1);
    expect(parsed.warnings.some((warning) => warning.code === "blank-lines")).toBe(true);
  });

  it("strips a UTF-8 BOM and warns", () => {
    const parsed = parseCsv("\uFEFFa,b\n1,2");
    expect(parsed.hadBom).toBe(true);
    expect(parsed.header).toEqual(["a", "b"]);
    expect(parsed.warnings.some((warning) => warning.code === "bom")).toBe(true);
  });

  it("detects CRLF and mixed line endings", () => {
    const parsed = parseCsv("a,b\r\n1,2\r\n");
    expect(parsed.lineEnding).toBe("\r\n");
    expect(parsed.mixedLineEndings).toBe(false);

    const mixed = parseCsv("a,b\r\n1,2\n3,4");
    expect(mixed.mixedLineEndings).toBe(true);
    expect(mixed.warnings.some((warning) => warning.code === "mixed-line-endings")).toBe(true);
  });

  it("warns about duplicate and empty headers", () => {
    const parsed = parseCsv("name,name,\nAda,Lovelace,x");
    expect(parsed.warnings.some((warning) => warning.code === "duplicate-header")).toBe(true);
    expect(parsed.warnings.some((warning) => warning.code === "empty-header")).toBe(true);
  });

  it("generates column names when the first row is not a header", () => {
    const parsed = parseCsv("Ada,36\nGrace,85", { hasHeader: false });
    expect(parsed.header).toEqual(["column_1", "column_2"]);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rowCount).toBe(2);
  });

  it("respects an explicit delimiter", () => {
    const parsed = parseCsv("a,b;c", { delimiter: ";" });
    expect(parsed.header).toEqual(["a,b", "c"]);
  });

  it("handles empty input", () => {
    const parsed = parseCsv("   \n");
    expect(parsed.empty).toBe(true);
    expect(parsed.header).toEqual([]);
    expect(parsed.rows).toEqual([]);
  });

  it("caps row-length errors for very broken files", () => {
    const rows = Array.from({ length: 40 }, (_, index) => `${index},x`).join("\n");
    const parsed = parseCsv(`a,b,c\n${rows}`);
    expect(parsed.errors.filter((error) => error.code === "row-length")).toHaveLength(25);
    expect(parsed.errors.some((error) => error.code === "error-limit")).toBe(true);
  });
});

describe("uniqueHeaders", () => {
  it("suffixes duplicates and fills empty names", () => {
    expect(uniqueHeaders(["a", "a", "", "b", "a"])).toEqual(["a", "a_2", "column_3", "b", "a_3"]);
  });
});

describe("formatCsv", () => {
  it("quotes only the fields that need it", () => {
    const output = formatCsv(["a", "b"], [["plain", 'has "quotes"'], ["has,comma", "line\nbreak"]]);
    expect(output).toBe('a,b\nplain,"has ""quotes"""\n"has,comma","line\nbreak"');
  });

  it("uses the requested delimiter and line ending", () => {
    expect(formatCsv(["a", "b"], [["1", "2"]], { delimiter: "\t", lineEnding: "\r\n" })).toBe(
      "a\tb\r\n1\t2",
    );
  });

  it("pads short rows", () => {
    expect(formatCsv(["a", "b", "c"], [["1", "2"]])).toBe("a,b,c\n1,2,");
  });
});

describe("csvToJson", () => {
  it("builds objects keyed by the header", () => {
    expect(csvToJson(["name", "age"], [["Ada", "36"]])).toEqual([{ name: "Ada", age: "36" }]);
  });

  it("keeps duplicate columns as separate keys", () => {
    expect(csvToJson(["name", "name"], [["Ada", "Lovelace"]])).toEqual([
      { name: "Ada", name_2: "Lovelace" },
    ]);
  });

  it("pads missing cells with empty strings", () => {
    expect(csvToJson(["a", "b"], [["1"]])).toEqual([{ a: "1", b: "" }]);
  });
});

describe("csvToTypeScript", () => {
  it("types every column as a string, matching the JSON output", () => {
    const output = csvToTypeScript(["name", "age", "active", "zip"], "Person");
    expect(output).toBe(
      "export interface Person {\n  name: string;\n  age: string;\n  active: string;\n  zip: string;\n}",
    );
  });

  it("does not narrow identifier-like values such as a leading-zero zip", () => {
    const output = csvToTypeScript(["zip", "phone", "id"]);
    expect(output).toContain("zip: string;");
    expect(output).toContain("phone: string;");
    expect(output).toContain("id: string;");
  });

  it("quotes property names that are not identifiers", () => {
    const output = csvToTypeScript(["first name"]);
    expect(output).toContain('"first name": string;');
  });

  it("handles no columns", () => {
    expect(csvToTypeScript([])).toBe("export interface Row {}");
  });
});

describe("csvToYaml", () => {
  it("emits a sequence of quoted mappings", () => {
    expect(csvToYaml(["name", "age"], [["Ada", "36"]])).toBe('- name: "Ada"\n  age: "36"');
  });

  it("escapes quotes, backslashes and newlines", () => {
    expect(csvToYaml(["note"], [['a "b" \\ c\nd']])).toBe('- note: "a \\"b\\" \\\\ c\\nd"');
  });

  it("quotes non-identifier keys", () => {
    expect(csvToYaml(["first name"], [["Ada"]])).toBe('- "first name": "Ada"');
  });

  it("quotes keys that YAML would read as null or a boolean", () => {
    const output = csvToYaml(
      ["null", "Null", "true", "FALSE", "yes", "no", "on", "Off", "y", "N"],
      [["x", "x", "x", "x", "x", "x", "x", "x", "x", "x"]],
    );
    for (const key of ["null", "Null", "true", "FALSE", "yes", "no", "on", "Off", "y", "N"]) {
      expect(output).toContain(`"${key}": "x"`);
    }
    // The first key also carries the sequence dash.
    expect(output.startsWith('- "null": "x"')).toBe(true);
  });

  it("leaves ordinary keys unquoted", () => {
    expect(csvToYaml(["first_name", "user-id"], [["Ada", "1"]])).toBe(
      '- first_name: "Ada"\n  user-id: "1"',
    );
  });

  it("returns an empty sequence for no rows", () => {
    expect(csvToYaml(["a"], [])).toBe("[]");
  });
});

describe("csvToSql", () => {
  it("quotes text and leaves numbers bare", () => {
    expect(csvToSql(["name", "age"], [["Ada", "36"]], "people")).toBe(
      "INSERT INTO `people` (`name`, `age`) VALUES ('Ada', 36);",
    );
  });

  it("uses NULL for empty cells", () => {
    expect(csvToSql(["note"], [[""]], "t")).toBe("INSERT INTO `t` (`note`) VALUES (NULL);");
  });

  it("quotes identifier-like values so leading zeros and plus signs survive", () => {
    expect(csvToSql(["zip", "phone", "id"], [["02134", "+15551234567", "007"]], "t")).toBe(
      "INSERT INTO `t` (`zip`, `phone`, `id`) VALUES ('02134', '+15551234567', '007');",
    );
  });

  it("still emits plain numbers bare", () => {
    expect(csvToSql(["a", "b", "c", "d"], [["0", "-2.5", "1e3", "36"]], "t")).toContain(
      "VALUES (0, -2.5, 1e3, 36);",
    );
  });

  it("escapes single quotes and backslashes", () => {
    expect(csvToSql(["note"], [["O'Brien \\ ok"]], "t")).toBe(
      "INSERT INTO `t` (`note`) VALUES ('O''Brien \\\\ ok');",
    );
  });

  it("escapes backticks in identifiers", () => {
    expect(csvToSql(["we`ird"], [["x"]], "ta`ble")).toBe(
      "INSERT INTO `ta``ble` (`we``ird`) VALUES ('x');",
    );
  });
});

describe("prettifyCsv", () => {
  it("aligns columns and adds a separator", () => {
    const output = prettifyCsv(["name", "n"], [["Ada", "1"], ["Grace Hopper", "22"]]);
    expect(output.split("\n")[0]).toBe("name         | n");
    expect(output.split("\n")[1]).toBe("-------------+---");
    expect(output.split("\n")[2]).toBe("Ada          | 1");
  });

  it("returns an empty string without columns", () => {
    expect(prettifyCsv([], [])).toBe("");
  });
});

describe("delimiterLabel", () => {
  it("names each delimiter", () => {
    expect(delimiterLabel(",")).toBe("Comma");
    expect(delimiterLabel("\t")).toBe("Tab");
  });
});
