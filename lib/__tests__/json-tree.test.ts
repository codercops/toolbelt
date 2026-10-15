import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { TreeView } from "../../app/(tools)/json-formatter/components/OutputPanel";

function renderTree(output: string, forceOpen: boolean | null = true) {
  return renderToStaticMarkup(createElement(TreeView, { output, forceOpen }));
}

describe("JSON Tree view", () => {
  it("renders large integers and high-precision decimals as exact numeric leaves", () => {
    const html = renderTree('{"id":12345678901234567890,"pi":3.141592653589793238}');

    expect(html).toContain('<span class="tok-number">12345678901234567890</span>');
    expect(html).toContain('<span class="tok-number">3.141592653589793238</span>');
    // Only the enclosing object should have an expand/collapse control.
    expect(html.match(/<button /g)).toHaveLength(1);
    expect(html).not.toContain("isLosslessNumber");
  });

  it.each([
    "9007199254740993",
    "-12345678901234567890",
    "3.141592653589793238",
    "1e400",
    "1e-400",
    "-0",
    "1.2300",
    "42",
  ])("keeps the numeric root %s as a leaf even when collapsed", (number) => {
    const html = renderTree(number, false);

    expect(html).toContain(`<span class="tok-number">${number}</span>`);
    expect(html).not.toContain("<button");
  });

  it("preserves exact numeric leaves in nested arrays and objects", () => {
    const html = renderTree('{"items":[12345678901234567890,{"value":3.141592653589793238}]}');

    expect(html).toContain('<span class="tok-number">12345678901234567890</span>');
    expect(html).toContain('<span class="tok-number">3.141592653589793238</span>');
    // Root object, items array and nested object — never the numbers themselves.
    expect(html.match(/<button /g)).toHaveLength(3);
  });

  it("keeps strings, booleans and null distinct from numeric leaves", () => {
    const html = renderTree('["12345678901234567890",true,false,null,42]');

    expect(html).toContain('<span class="tok-string">&quot;12345678901234567890&quot;</span>');
    expect(html).toContain('<span class="tok-bool">true</span>');
    expect(html).toContain('<span class="tok-bool">false</span>');
    expect(html).toContain('<span class="tok-null">null</span>');
    expect(html).toContain('<span class="tok-number">42</span>');
  });

  it("still collapses real containers", () => {
    const html = renderTree('{"id":12345678901234567890,"items":[]}', false);

    expect(html).toContain('aria-label="Expand"');
    expect(html).toContain("2 keys");
    expect(html).not.toContain('class="tok-number"');
  });

  it("does not mistake user objects with LosslessNumber-like fields for numbers", () => {
    const html = renderTree('{"isLosslessNumber":true,"value":"test","toString":"text"}');

    expect(html.match(/<button /g)).toHaveLength(1);
    expect(html).toContain('<span class="tok-key">&quot;isLosslessNumber&quot;</span>');
    expect(html).toContain('<span class="tok-string">&quot;test&quot;</span>');
    expect(html).toContain('<span class="tok-string">&quot;text&quot;</span>');
    expect(html).not.toContain('class="tok-number"');
  });

  it("shows the existing error for invalid JSON", () => {
    expect(renderTree('{"id":')).toContain("Could not parse tree view");
  });
});
