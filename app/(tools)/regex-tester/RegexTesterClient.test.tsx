import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { RegexTesterClient } from "./RegexTesterClient";

const mockWriteText = vi.fn().mockResolvedValue(undefined);

function renderClient() {
  return render(
    <ToastProvider>
      <RegexTesterClient />
    </ToastProvider>,
  );
}

describe("RegexTesterClient", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
    mockWriteText.mockClear();
  });

  afterEach(cleanup);

  it("shows 2 matches for the initial sample text", () => {
    renderClient();
    expect(screen.getByRole("heading", { name: "2 matches" })).toBeInTheDocument();
  });

  it("shows '1 match' when there is a single match", async () => {
    renderClient();
    fireEvent.change(screen.getByLabelText("Pattern"), { target: { value: "^Released" } });

    expect(await screen.findByRole("heading", { name: "1 match" })).toBeInTheDocument();
  });

  it("shows 'More than 1,000 matches, showing the first 1,000' when matches exceed the limit", async () => {
    renderClient();
    fireEvent.change(screen.getByLabelText("Pattern"), { target: { value: "a" } });
    fireEvent.change(screen.getByLabelText("Test text"), { target: { value: "a".repeat(1500) } });

    expect(
      await screen.findByRole("heading", { name: "More than 1,000 matches, showing the first 1,000" }),
    ).toBeInTheDocument();
  });

  it("has accessible name 'Copy result' on the copy button and copies the replacement result", async () => {
    renderClient();
    const copyButton = screen.getByRole("button", { name: "Copy result" });
    expect(copyButton).toBeInTheDocument();
    fireEvent.click(copyButton);
    await waitFor(() => expect(mockWriteText).toHaveBeenCalled());
  });
});
