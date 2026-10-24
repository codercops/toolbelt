import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CopyButton } from "./CopyButton";
import { ToastProvider } from "./Toast";

describe("CopyButton", () => {
  const mockWriteText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
  });

  it("copies value to clipboard and shows Copied label", async () => {
    render(
      <ToastProvider>
        <CopyButton value="hello-world" />
      </ToastProvider>
    );

    const button = screen.getByRole("button", { name: "Copy" });
    fireEvent.click(button);

    expect(mockWriteText).toHaveBeenCalledWith("hello-world");

    await waitFor(() => {
      expect(screen.getByText("Copied")).toBeInTheDocument();
    });
  });

  it("uses ariaLabel for the accessible name without changing visible text", () => {
    render(
      <ToastProvider>
        <CopyButton value="hello-world" ariaLabel="Copy Base64 output" />
      </ToastProvider>
    );

    expect(screen.getByRole("button", { name: "Copy Base64 output" })).toBeInTheDocument();
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });
});
