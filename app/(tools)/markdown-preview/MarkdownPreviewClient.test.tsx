import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownPreviewClient } from "./MarkdownPreviewClient";

describe("MarkdownPreviewClient", () => {
  it("sanitizes scripts, event handlers, and javascript links", async () => {
    render(<MarkdownPreviewClient />);
    fireEvent.change(screen.getByLabelText("Markdown input"), {
      target: { value: '<script>alert("xss")</script>\n\n<img src="x" onerror="alert(1)">\n\n[javascript](javascript:alert(1))' },
    });

    await screen.findByText("Preview");
    const preview = document.querySelector(".markdown-preview");
    expect(preview?.querySelector("script")).toBeNull();
    expect(preview?.querySelector("[onerror]")).toBeNull();
    expect(preview?.querySelector('a[href^="javascript:"]')).toBeNull();
  });
});
