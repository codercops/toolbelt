import { describe, it, expect } from "vitest";
import { runJsonPath } from "../jsonpath";
import { SAMPLE_JSON } from "../json-utils";

describe("runJsonPath", () => {
  it.each(["", " \t\n "])("rejects blank JSON %j", (raw) => {
    expect(runJsonPath(raw, "$..email")).toEqual({
      ok: false,
      matches: [],
      paths: [],
      error: "Paste JSON first",
    });
  });

  it.each(["", " \t\n "])("rejects a blank expression %j", (path) => {
    expect(runJsonPath(SAMPLE_JSON, path)).toEqual({
      ok: false,
      matches: [],
      paths: [],
      error: "Enter a JSONPath expression",
    });
  });

  it("reports invalid JSON without matches or paths", () => {
    expect(runJsonPath("{", "$..email")).toEqual({
      ok: false,
      matches: [],
      paths: [],
      error: expect.stringMatching(/^Invalid JSON: /),
    });
  });

  it("finds both email values with their matching paths", () => {
    expect(runJsonPath(SAMPLE_JSON, "$..email")).toEqual({
      ok: true,
      matches: ["ada@codercops.com", true],
      paths: [
        "$['user']['email']",
        "$['user']['preferences']['notifications']['email']",
      ],
    });
  });

  it("filters out inactive projects", () => {
    expect(runJsonPath(SAMPLE_JSON, "$.user.projects[?(@.active==true)]")).toEqual({
      ok: true,
      matches: [{ id: 1, name: "Atlas", active: true }],
      paths: ["$['user']['projects'][0]"],
    });
  });

  it("returns an empty successful result when nothing matches", () => {
    expect(runJsonPath(SAMPLE_JSON, "$.user.missing")).toEqual({
      ok: true,
      matches: [],
      paths: [],
    });
  });
});
