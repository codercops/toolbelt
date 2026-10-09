import { describe, it, expect } from "vitest";
import { SAMPLE_JSON } from "../json-utils";
import { validateSchema, SAMPLE_SCHEMA } from "../jsonSchema";

describe("validateSchema", () => {
  it.each([
    ["empty data", "", SAMPLE_SCHEMA, "Paste JSON first"],
    ["whitespace-only data", " \n\t ", SAMPLE_SCHEMA, "Paste JSON first"],
    ["empty schema", SAMPLE_JSON, "", "Paste a JSON Schema"],
    ["whitespace-only schema", SAMPLE_JSON, " \n\t ", "Paste a JSON Schema"],
    ["both inputs empty", "", "", "Paste JSON first"],
    ["both inputs whitespace-only", " \n\t ", " \n\t ", "Paste JSON first"],
  ])("rejects %s", (_label, jsonRaw, schemaRaw, parseError) => {
    expect(validateSchema(jsonRaw, schemaRaw)).toEqual({
      ok: false,
      valid: false,
      errors: [],
      parseError,
    });
  });

  it("reports invalid JSON data separately from schema validation", () => {
    expect(validateSchema("{", SAMPLE_SCHEMA)).toEqual({
      ok: false,
      valid: false,
      errors: [],
      parseError: expect.stringMatching(/^Invalid JSON data: \S/),
    });
  });

  it("reports invalid schema JSON separately from data parsing", () => {
    expect(validateSchema(SAMPLE_JSON, "{")).toEqual({
      ok: false,
      valid: false,
      errors: [],
      parseError: expect.stringMatching(/^Invalid schema JSON: \S/),
    });
  });

  it("validates SAMPLE_JSON against SAMPLE_SCHEMA without errors", () => {
    expect(validateSchema(SAMPLE_JSON, SAMPLE_SCHEMA)).toEqual({
      ok: true,
      valid: true,
      errors: [],
    });
  });

  it("identifies a missing required property at the root", () => {
    const { user } = JSON.parse(SAMPLE_JSON);

    expect(validateSchema(JSON.stringify({ user }), SAMPLE_SCHEMA)).toEqual({
      ok: true,
      valid: false,
      errors: [
        {
          instanceLocation: "#",
          keyword: "required",
          message: expect.stringContaining("meta"),
        },
      ],
    });
  });

  it("reports the location and minimum constraint for a negative age", () => {
    const data = JSON.parse(SAMPLE_JSON);
    data.user.age = -1;

    expect(validateSchema(JSON.stringify(data), SAMPLE_SCHEMA)).toEqual({
      ok: true,
      valid: false,
      errors: expect.arrayContaining([
        {
          instanceLocation: "#/user/age",
          keyword: "minimum",
          message: expect.stringMatching(/-1.*\b0\b/),
        },
      ]),
    });
  });

  it("reports the location and minLength constraint for an empty name", () => {
    const data = JSON.parse(SAMPLE_JSON);
    data.user.name = "";

    expect(validateSchema(JSON.stringify(data), SAMPLE_SCHEMA)).toEqual({
      ok: true,
      valid: false,
      errors: expect.arrayContaining([
        {
          instanceLocation: "#/user/name",
          keyword: "minLength",
          message: expect.stringMatching(/\b0\b.*\b1\b/),
        },
      ]),
    });
  });
});
