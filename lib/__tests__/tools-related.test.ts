import { describe, it, expect } from "vitest";
import { getRelatedTools, TOOLS, type Tool } from "../tools";

// Minimal registry so edge cases (single-tool category, tiny registry) are
// reachable without editing TOOLS.
const mini: Tool[] = [
  { ...TOOLS[0], slug: "a", applicationCategory: "DeveloperApplication" },
  { ...TOOLS[0], slug: "b", applicationCategory: "DeveloperApplication" },
  { ...TOOLS[1], slug: "c", applicationCategory: "BusinessApplication" },
];

describe("getRelatedTools", () => {
  it("excludes the current tool", () => {
    const result = getRelatedTools("json-formatter");
    expect(result.map((t) => t.slug)).not.toContain("json-formatter");
  });

  it("returns 2-3 items for every real tool", () => {
    for (const tool of TOOLS) {
      const result = getRelatedTools(tool.slug);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.length).toBeLessThanOrEqual(3);
    }
  });

  it("is deterministic — same slug yields the same order", () => {
    const first = getRelatedTools("base64").map((t) => t.slug);
    const second = getRelatedTools("base64").map((t) => t.slug);
    expect(second).toEqual(first);
  });

  it("lists same-category tools first, in registry order", () => {
    // json-formatter is a DeveloperApplication; its same-category siblings in
    // registry order are jwt-decoder then base64, then the business tool.
    expect(getRelatedTools("json-formatter").map((t) => t.slug)).toEqual([
      "jwt-decoder",
      "base64",
      "invoice-generator",
    ]);
  });

  it("falls back to other tools for a single-tool category", () => {
    // invoice-generator is the only BusinessApplication tool.
    const result = getRelatedTools("invoice-generator");
    expect(result.length).toBe(3);
    expect(result.map((t) => t.slug)).not.toContain("invoice-generator");
    expect(result.every((t) => t.applicationCategory === "DeveloperApplication")).toBe(true);
  });

  it("returns an empty list for an unknown slug", () => {
    expect(getRelatedTools("does-not-exist")).toEqual([]);
  });

  it("handles a registry with fewer than 2 other tools", () => {
    expect(getRelatedTools("a", 3, mini).map((t) => t.slug)).toEqual(["b", "c"]);
    expect(getRelatedTools("c", 3, mini).map((t) => t.slug)).toEqual(["a", "b"]);
    expect(getRelatedTools("a", 1, mini).map((t) => t.slug)).toEqual(["b"]);
  });
});
