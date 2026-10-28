import { describe, it, expect } from "vitest";
import { analyzeQueryParams, encodeUrl, decodeUrl, parseUrl } from "../url-utils";

describe("encodeUrl / decodeUrl round-trip", () => {
  it("round-trips unicode text", () => {
    const s = "héllo wörld 🚀";
    const enc = encodeUrl(s, "component");
    const dec = decodeUrl(enc.ok ? enc.value : "");
    expect(dec.ok && dec.value).toBe(s);
  });

  it("component and uri modes encode a path+query differently", () => {
    const s = "a/b?c=d&e";
    const component = encodeUrl(s, "component");
    const uri = encodeUrl(s, "uri");
    if (!component.ok || !uri.ok) throw new Error("expected both encodings to succeed");
    expect(component.value).not.toBe(uri.value);
    // component mode escapes every reserved character, including / ? = &
    expect(component.value).toContain("%2F");
    // uri mode leaves path/query structure characters alone
    expect(uri.value).toContain("/");
    expect(uri.value).toContain("?");
  });
});

describe("encodeUrl", () => {
  it.each(["component", "uri"] as const)(
    "returns ok: false with a readable message for a lone surrogate in %s mode, never throws",
    (mode) => {
      const r = encodeUrl("a\uD800b", mode);
      expect(r.ok).toBe(false);
      expect(!r.ok && r.error.length).toBeGreaterThan(0);
    }
  );

  it.each(["component", "uri"] as const)("still encodes a full emoji in %s mode", (mode) => {
    const r = encodeUrl("🚀", mode);
    expect(r).toEqual({ ok: true, value: "%F0%9F%9A%80" });
  });
});

describe("decodeUrl", () => {
  it("returns ok: false with a readable message for malformed input, never throws", () => {
    const r = decodeUrl("%E0%A4%A");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error.length).toBeGreaterThan(0);
  });

  it("treats + as space when plusAsSpace is set", () => {
    const r = decodeUrl("a+b+c", { plusAsSpace: true });
    expect(r.ok && r.value).toBe("a b c");
  });

  it("leaves + alone when plusAsSpace is not set", () => {
    const r = decodeUrl("a+b+c");
    expect(r.ok && r.value).toBe("a+b+c");
  });
});

describe("parseUrl", () => {
  it("keeps duplicate query keys in order", () => {
    const r = parseUrl("https://example.com/path?a=1&a=2&b=3");
    expect(r.ok && r.value.params).toEqual([
      ["a", "1"],
      ["a", "2"],
      ["b", "3"],
    ]);
  });

  it("extracts protocol, host, port, pathname, and hash", () => {
    const r = parseUrl("https://example.com:8080/path#section");
    expect(r.ok && r.value.protocol).toBe("https:");
    expect(r.ok && r.value.host).toBe("example.com:8080");
    expect(r.ok && r.value.port).toBe("8080");
    expect(r.ok && r.value.pathname).toBe("/path");
    expect(r.ok && r.value.hash).toBe("#section");
  });

  it("returns ok: false for an invalid URL", () => {
    const r = parseUrl("not a url");
    expect(r.ok).toBe(false);
  });
});

describe("analyzeQueryParams", () => {
  it("marks every same-valued and different-valued repeat and reports distinct repeated names", () => {
    const result = analyzeQueryParams([["tag", "react"], ["tag", "typescript"], ["sort", "a"], ["sort", "a"]]);
    expect(result.occurrences.map(({ repeated }) => repeated)).toEqual([true, true, true, true]);
    expect(result.repeatedKeys).toEqual(["tag", "sort"]);
  });
  it("groups decoded names, preserves case sensitivity, empty names, values, and order", () => {
    const result = analyzeQueryParams([["tag", "a"], ["tag", "b"], ["Tag", "c"], ["tag", ""], ["", ""], ["", "x"]]);
    expect(result.occurrences).toEqual([
      { key: "tag", value: "a", repeated: true }, { key: "tag", value: "b", repeated: true },
      { key: "Tag", value: "c", repeated: false }, { key: "tag", value: "", repeated: true },
      { key: "", value: "", repeated: true }, { key: "", value: "x", repeated: true },
    ]);
    expect(result.repeatedKeys).toEqual(["tag", ""]);
  });
  it("leaves unique and empty parameter lists unflagged", () => {
    expect(analyzeQueryParams([["a", ""], ["b", "2"]]).repeatedKeys).toEqual([]);
    expect(analyzeQueryParams([])).toEqual({ occurrences: [], repeatedKeys: [] });
  });
});
