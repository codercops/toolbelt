import { createElement, createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, vi } from "vitest";
import { FindHighlight } from "../../app/(tools)/json-formatter/components/FindHighlight";
import { selectFindMatch } from "../../app/(tools)/json-formatter/components/find-selection";

function makeEditor(value: string) {
  return { value, focus: vi.fn(), matches: vi.fn().mockReturnValue(false), setSelectionRange: vi.fn(), scrollTop: 0 };
}

describe("JSON find selection", () => {
  it("selects the entire match without changing the document", () => {
    const value = '{"email":"hello@example.com"}';
    const editor = makeEditor(value);
    const start = value.indexOf("email");

    selectFindMatch(editor, start, start + "email".length);

    expect(editor.setSelectionRange).toHaveBeenCalledWith(start, start + 5);
    expect(editor.value).toBe(value);
  });

  it("does not steal focus from the Find box", () => {
    const editor = makeEditor("email email");

    selectFindMatch(editor, 0, 5);
    selectFindMatch(editor, 6, 11);

    expect(editor.focus).not.toHaveBeenCalled();
  });

  it("preserves the editor's selection and scroll position while it has focus", () => {
    const value = 'ab  "email": "hello@example.com"';
    const editor = makeEditor(value);
    editor.matches.mockReturnValue(true);
    editor.scrollTop = 100;
    const start = value.indexOf("email");

    selectFindMatch(editor, start, start + 5);

    expect(editor.matches).toHaveBeenCalledWith(":focus");
    expect(editor.setSelectionRange).not.toHaveBeenCalled();
    expect(editor.scrollTop).toBe(100);
    expect(editor.value).toBe(value);
    expect(editor.focus).not.toHaveBeenCalled();
  });

  it("resumes match selection after focus leaves the editor", () => {
    const editor = makeEditor("one\ntwo\nthree\nfour\nfive\nemail");
    const start = editor.value.indexOf("email");
    editor.matches.mockReturnValue(true);
    editor.scrollTop = 100;
    selectFindMatch(editor, start, start + 5);
    expect(editor.setSelectionRange).not.toHaveBeenCalled();

    editor.matches.mockReturnValue(false);
    selectFindMatch(editor, start, start + 5);

    expect(editor.setSelectionRange).toHaveBeenCalledExactlyOnceWith(start, start + 5);
    expect(editor.scrollTop).toBeCloseTo(2 * 21.45);
  });

  it("scrolls to the match with the existing line context", () => {
    const editor = makeEditor("one\ntwo\nthree\nfour\nfive\nemail");
    const start = editor.value.indexOf("email");

    selectFindMatch(editor, start, start + 5);
    expect(editor.scrollTop).toBeCloseTo(2 * 21.45);

    selectFindMatch(editor, 0, 3);
    expect(editor.scrollTop).toBe(0);
  });
});

describe("JSON find highlight", () => {
  it("marks only the active match and hides the mirror from assistive technology", () => {
    const html = renderToStaticMarkup(createElement(FindHighlight, {
      editorRef: createRef<HTMLTextAreaElement>(),
      text: "email Email",
      match: { start: 6, end: 11 },
    }));

    expect(html).toContain('aria-hidden="true"');
    expect(html.match(/<mark /g)).toHaveLength(1);
    expect(html).toContain(">Email</mark>");
  });

  it("renders JSON content as text, never as HTML", () => {
    const text = '<img src=x onerror="alert(1)">';
    const html = renderToStaticMarkup(createElement(FindHighlight, {
      editorRef: createRef<HTMLTextAreaElement>(), text, match: { start: 0, end: text.length },
    }));

    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("does not mark anything when the query is empty or has no matches", () => {
    const html = renderToStaticMarkup(createElement(FindHighlight, {
      editorRef: createRef<HTMLTextAreaElement>(), text: "email", match: null,
    }));

    expect(html).not.toContain("<mark");
    expect(html).toContain("email");
  });
});
