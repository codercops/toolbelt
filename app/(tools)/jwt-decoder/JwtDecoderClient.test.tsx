import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "app/(tools)/jwt-decoder/JwtDecoderClient.tsx"), "utf8");

describe("JWT decoder cURL disclosure", () => {
  it("exposes a stateful control connected to its panel", () => {
    expect(source).toContain('aria-expanded={curlOpen}');
    expect(source).toContain('aria-controls="jwt-curl-panel"');
    expect(source).toContain('id="jwt-curl-panel"');
    expect(source).toContain("setCurlOpen((v) => !v)");
  });
});
