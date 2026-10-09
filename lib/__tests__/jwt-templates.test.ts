import { describe, it, expect } from "vitest";
import { curlWithToken } from "../jwt-templates";

describe("curlWithToken", () => {
  it("single-quotes the header and the endpoint", () => {
    expect(curlWithToken("a.b.c", "https://api.example.com/me?x=1&y=2")).toBe(
      "curl -H 'Authorization: Bearer a.b.c' \\\n  'https://api.example.com/me?x=1&y=2'"
    );
  });

  it("keeps shell syntax in the token literal", () => {
    const out = curlWithToken("a.b.$(id)`id`");
    expect(out).toContain("'Authorization: Bearer a.b.$(id)`id`'");
  });

  it("escapes single quotes", () => {
    expect(curlWithToken("a.b.c", "https://e.com/it's")).toContain("'https://e.com/it'\\''s'");
  });
});
