import { describe, expect, it } from "vitest";
import { BASE64_PREVIEW_LIMIT, base64Preview } from "../base64-utils";

describe("base64Preview", () => {
  it("keeps a value shorter than the limit whole", () => {
    const value = "QUJD".repeat(4);
    const p = base64Preview(value);
    expect(p.truncated).toBe(false);
    expect(p.text).toBe(value);
    expect(p.total).toBe(value.length);
    expect(p.shown).toBe(value.length);
  });

  it("keeps a value exactly at the limit whole", () => {
    const value = "A".repeat(BASE64_PREVIEW_LIMIT);
    const p = base64Preview(value);
    expect(p.truncated).toBe(false);
    expect(p.text).toHaveLength(BASE64_PREVIEW_LIMIT);
    expect(p.shown).toBe(p.total);
  });

  it("caps a value above the limit and reports how much is shown (#497)", () => {
    const value = "A".repeat(BASE64_PREVIEW_LIMIT + 1);
    const p = base64Preview(value);
    expect(p.truncated).toBe(true);
    expect(p.text).toHaveLength(BASE64_PREVIEW_LIMIT);
    expect(p.shown).toBe(BASE64_PREVIEW_LIMIT);
    expect(p.total).toBe(BASE64_PREVIEW_LIMIT + 1);
    expect(p.text).toBe(value.slice(0, BASE64_PREVIEW_LIMIT));
  });

  it("honours an explicit limit", () => {
    const p = base64Preview("abcdef", 4);
    expect(p.text).toBe("abcd");
    expect(p.truncated).toBe(true);
    expect(p.total).toBe(6);
    expect(p.shown).toBe(4);
  });

  it("never reports a negative or zero-length preview for a non-empty value", () => {
    const p = base64Preview("abc", -1);
    expect(p.text).toBe("");
    expect(p.truncated).toBe(true);
    expect(p.total).toBe(3);
    expect(p.shown).toBe(0);
  });

  it("exposes the 64 KB limit the File tab renders", () => {
    expect(BASE64_PREVIEW_LIMIT).toBe(65536);
  });
});
