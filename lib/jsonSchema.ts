import { Validator } from "@cfworker/json-schema";

export interface SchemaValidationResult {
  ok: boolean;
  valid: boolean;
  errors: { instanceLocation: string; keyword: string; message: string }[];
  parseError?: string;
}

export function validateSchema(jsonRaw: string, schemaRaw: string): SchemaValidationResult {
  if (!jsonRaw.trim() || !schemaRaw.trim()) {
    return {
      ok: false,
      valid: false,
      errors: [],
      parseError: !jsonRaw.trim() ? "Paste JSON first" : "Paste a JSON Schema",
    };
  }
  let data: unknown;
  let schema: unknown;
  try {
    data = JSON.parse(jsonRaw);
  } catch (e) {
    return {
      ok: false,
      valid: false,
      errors: [],
      parseError: `Invalid JSON data: ${e instanceof Error ? e.message : "parse error"}`,
    };
  }
  try {
    schema = JSON.parse(schemaRaw);
  } catch (e) {
    return {
      ok: false,
      valid: false,
      errors: [],
      parseError: `Invalid schema JSON: ${e instanceof Error ? e.message : "parse error"}`,
    };
  }
  try {
    const validator = new Validator(schema as object, "2020-12");
    const result = validator.validate(data);
    return {
      ok: true,
      valid: result.valid,
      errors: result.errors.map((e) => ({
        instanceLocation: e.instanceLocation,
        keyword: e.keyword,
        message: e.error,
      })),
    };
  } catch (e) {
    return {
      ok: false,
      valid: false,
      errors: [],
      parseError: `Schema error: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
}

export const SAMPLE_SCHEMA = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["user", "meta"],
  "properties": {
    "user": {
      "type": "object",
      "required": ["id", "name", "email"],
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string", "minLength": 1 },
        "email": { "type": "string", "format": "email" },
        "age": { "type": "integer", "minimum": 0 }
      }
    },
    "meta": {
      "type": "object",
      "properties": {
        "version": { "type": "string" }
      }
    }
  }
}`;
