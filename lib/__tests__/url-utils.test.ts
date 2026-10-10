import { describe, it, expect } from "vitest";
import { encodeUrl, decodeUrl, parseUrl } from "../url-utils";

describe("encodeUrl / decodeUrl round-trip", () => {
  it("round-trips unicode text", () => {
    const s = "héllo wörld 🚀";
    const enc = encodeUrl(s, "component");
    const dec = decodeUrl(enc);
    expect(dec.ok && dec.value).toBe(s);
  });

  it("component and uri modes encode a path+query differently", () => {
    const s = "a/b?c=d&e";
    const component = encodeUrl(s, "component");
    const uri = encodeUrl(s, "uri");
    expect(component).not.toBe(uri);
    // component mode escapes every reserved character, including / ? = &
    expect(component).toContain("%2F");
    // uri mode leaves path/query structure characters alone
    expect(uri).toContain("/");
    expect(uri).toContain("?");
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
