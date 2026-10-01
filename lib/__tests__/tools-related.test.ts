import { describe, it, expect } from "vitest";
import { getRelatedTools, TOOLS, type Tool } from "../tools";

// Mini registries are injected through getRelatedTools's third argument so
// exact-order assertions stay valid as tools are added to TOOLS.
// In `mini`: a, c, d are DeveloperApplication; b is the only
// BusinessApplication tool.
const mini: Tool[] = [
  { ...TOOLS[0], slug: "a", applicationCategory: "DeveloperApplication" },
  { ...TOOLS[1], slug: "b", applicationCategory: "BusinessApplication" },
  { ...TOOLS[2], slug: "c", applicationCategory: "DeveloperApplication" },
  { ...TOOLS[3], slug: "d", applicationCategory: "DeveloperApplication" },
];

// Two tools, same category — the "fewer than 2 other tools" edge case.
const tiny: Tool[] = [
  { ...TOOLS[0], slug: "x", applicationCategory: "DeveloperApplication" },
  { ...TOOLS[1], slug: "y", applicationCategory: "DeveloperApplication" },
];

describe("getRelatedTools (mini registry)", () => {
  it("lists same-category tools first, then the rest, each in registry order", () => {
    expect(getRelatedTools("a", 3, mini).map((t) => t.slug)).toEqual(["c", "d", "b"]);
  });

  it("falls back to the other tools when the category has a single tool", () => {
    // b is the only BusinessApplication tool in mini.
    expect(getRelatedTools("b", 3, mini).map((t) => t.slug)).toEqual(["a", "c", "d"]);
  });

  it("handles registries with fewer than 2 other tools", () => {
    expect(getRelatedTools("x", 3, tiny).map((t) => t.slug)).toEqual(["y"]);
    expect(getRelatedTools("y", 3, tiny).map((t) => t.slug)).toEqual(["x"]);
    expect(getRelatedTools("x", 1, tiny).map((t) => t.slug)).toEqual(["y"]);
  });

  it("honors the limit", () => {
    expect(getRelatedTools("a", 1, mini).map((t) => t.slug)).toEqual(["c"]);
    expect(getRelatedTools("a", 2, mini).map((t) => t.slug)).toEqual(["c", "d"]);
    expect(getRelatedTools("a", 0, mini)).toEqual([]);
  });
});

// Real-registry assertions only — everything here must stay true as new
// tools are appended to TOOLS.
describe("getRelatedTools (real registry)", () => {
  it("excludes the current tool", () => {
    for (const tool of TOOLS) {
      expect(getRelatedTools(tool.slug).map((t) => t.slug)).not.toContain(tool.slug);
    }
  });

  it("returns no more than the limit", () => {
    for (const tool of TOOLS) {
      expect(getRelatedTools(tool.slug).length).toBeLessThanOrEqual(3);
      expect(getRelatedTools(tool.slug, 2).length).toBeLessThanOrEqual(2);
    }
  });

  it("is deterministic — the same slug yields the same list", () => {
    const first = getRelatedTools("base64").map((t) => t.slug);
    const second = getRelatedTools("base64").map((t) => t.slug);
    expect(second).toEqual(first);
  });

  it("returns an empty list for an unknown slug", () => {
    expect(getRelatedTools("does-not-exist")).toEqual([]);
  });

  it("lists json-formatter's same-category siblings first, in registry order", () => {
    expect(
      getRelatedTools("json-formatter")
        .slice(0, 2)
        .map((t) => t.slug)
    ).toEqual(["jwt-decoder", "base64"]);
  });
});
