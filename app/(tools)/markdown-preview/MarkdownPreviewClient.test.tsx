import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkdownPreviewClient } from "./MarkdownPreviewClient";

describe("MarkdownPreviewClient", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("opens a Markdown file and updates the editor and preview", async () => {
    render(<MarkdownPreviewClient />);
    const file = new File(["# Imported document\n\nHello from a file."], "README.md", { type: "text/markdown" });

    fireEvent.change(screen.getByLabelText("Open Markdown file"), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByLabelText("Markdown input")).toHaveValue("# Imported document\n\nHello from a file."));
    expect(await screen.findByText("Imported document")).toBeInTheDocument();
  });

  it("preserves the document when replacement is canceled", () => {
    render(<MarkdownPreviewClient />);
    const editor = screen.getByLabelText("Markdown input");
    fireEvent.change(editor, { target: { value: "My edited document" } });
    window.confirm = vi.fn().mockReturnValue(false);
    const file = new File(["# Replacement"], "replacement.md", { type: "text/markdown" });

    fireEvent.change(screen.getByLabelText("Open Markdown file"), { target: { files: [file] } });

    expect(editor).toHaveValue("My edited document");
  });

  it("shows read failures and preserves the document", async () => {
    render(<MarkdownPreviewClient />);
    const editor = screen.getByLabelText("Markdown input");
    const original = (editor as HTMLTextAreaElement).value;
    const file = new File(["# Broken"], "broken.md", { type: "text/markdown" });
    Object.defineProperty(file, "text", { value: vi.fn().mockRejectedValue(new Error("read failed")) });

    fireEvent.change(screen.getByLabelText("Open Markdown file"), { target: { files: [file] } });

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not read");
    expect(editor).toHaveValue(original);
  });

  it("rejects oversized files without replacing the document", async () => {
    render(<MarkdownPreviewClient />);
    const editor = screen.getByLabelText("Markdown input");
    const original = (editor as HTMLTextAreaElement).value;
    const file = new File(["x"], "large.md", { type: "text/markdown" });
    Object.defineProperty(file, "size", { value: 1024 * 1024 + 1 });

    fireEvent.change(screen.getByLabelText("Open Markdown file"), { target: { files: [file] } });

    expect(await screen.findByRole("alert")).toHaveTextContent("smaller than 1 MiB");
    expect(editor).toHaveValue(original);
  });

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
