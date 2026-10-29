import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

describe("RegexTesterClient match navigation", () => {
  const previous = () => screen.getByRole("button", { name: "Previous match" });
  const next = () => screen.getByRole("button", { name: "Next match" });
  const status = () => screen.getByRole("status", { name: "Match navigation" });

  function settleInput() {
    act(() => vi.advanceTimersByTime(150));
  }

  function changeInput(label: string, value: string) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
    settleInput();
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("announces the initial position and distinguishes the active highlight", () => {
    renderClient();
    expect(status()).toHaveTextContent("Match 1 of 2");
    expect(status()).toHaveAttribute("aria-live", "polite");
    expect(status()).toHaveAttribute("aria-atomic", "true");
    expect(screen.getByLabelText("Match 1")).toHaveAttribute("aria-current", "true");
    expect(screen.getByLabelText("Match 2")).not.toHaveAttribute("aria-current");
    expect(previous()).toBeEnabled();
    expect(next()).toBeEnabled();
  });

  it("moves forward and backward, wrapping in both directions", () => {
    renderClient();
    fireEvent.click(next());
    expect(status()).toHaveTextContent("Match 2 of 2");
    expect(screen.getByLabelText("Match 2")).toHaveAttribute("aria-current", "true");
    expect(screen.getByLabelText("Match 1")).not.toHaveAttribute("aria-current");
    fireEvent.click(next());
    expect(status()).toHaveTextContent("Match 1 of 2");
    fireEvent.click(previous());
    expect(status()).toHaveTextContent("Match 2 of 2");
    fireEvent.click(previous());
    expect(status()).toHaveTextContent("Match 1 of 2");
    expect(screen.getByLabelText("Match 1")).toHaveAttribute("aria-current", "true");
  });

  it("keeps a single match selected in both directions", () => {
    renderClient();
    changeInput("Pattern", "^Released");
    fireEvent.click(next());
    fireEvent.click(previous());
    expect(status()).toHaveTextContent("Match 1 of 1");
    expect(screen.getByLabelText("Match 1")).toHaveAttribute("aria-current", "true");
  });

  it.each(["no matches", "empty pattern", "overlong text"])("disables navigation for %s", (scenario) => {
    renderClient();
    if (scenario === "no matches") changeInput("Pattern", "not-present");
    else if (scenario === "empty pattern") changeInput("Pattern", "");
    else changeInput("Test text", "a".repeat(100_001));
    expect(previous()).toBeDisabled();
    expect(next()).toBeDisabled();
    expect(status()).toHaveTextContent("No matches");
    expect(document.querySelector('[aria-current="true"]')).toBeNull();
  });

  it.each(["Pattern", "Test text", "flags"])("resets selection when %s changes", (field) => {
    renderClient();
    fireEvent.click(next());
    expect(status()).toHaveTextContent("Match 2 of 2");
    if (field === "flags") fireEvent.click(screen.getByRole("button", { name: "Ignore case" }));
    else fireEvent.change(screen.getByLabelText(field), {
      target: { value: field === "Pattern" ? "\\d{4}" : "2027-01-01 and 2028-02-02" },
    });
    expect(status()).toHaveTextContent("Updating matches");
    expect(next()).toBeDisabled();
    expect(previous()).toBeDisabled();
    settleInput();
    expect(status()).toHaveTextContent("Match 1 of 2");
    expect(screen.getByLabelText("Match 1")).toHaveAttribute("aria-current", "true");
  });

  it("clears invalid results and restores navigation after correcting the pattern", () => {
    renderClient();
    fireEvent.click(next());
    changeInput("Pattern", "(");
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid pattern");
    expect(next()).toBeDisabled();
    expect(previous()).toBeDisabled();
    expect(status()).toHaveTextContent("No matches");
    expect(document.querySelector('[aria-current="true"]')).toBeNull();
    changeInput("Pattern", "\\d{4}");
    expect(status()).toHaveTextContent("Match 1 of 2");
    expect(next()).toBeEnabled();
    expect(previous()).toBeEnabled();
  });

  it("keeps the index valid through batched edits and shrinking results", () => {
    renderClient();
    fireEvent.click(next());
    fireEvent.change(screen.getByLabelText("Pattern"), { target: { value: "(" } });
    fireEvent.change(screen.getByLabelText("Pattern"), { target: { value: "a" } });
    fireEvent.change(screen.getByLabelText("Test text"), { target: { value: "aaa" } });
    settleInput();
    fireEvent.click(previous());
    expect(status()).toHaveTextContent("Match 3 of 3");
    changeInput("Test text", "a");
    expect(status()).toHaveTextContent("Match 1 of 1");
    changeInput("Test text", "b");
    expect(status()).toHaveTextContent("No matches");
    changeInput("Test text", "aa");
    expect(status()).toHaveTextContent("Match 1 of 2");
  });

  it("navigates visible markers for zero-length matches, including the end of input", () => {
    renderClient();
    fireEvent.change(screen.getByLabelText("Pattern"), { target: { value: "(?:)" } });
    fireEvent.change(screen.getByLabelText("Test text"), { target: { value: "ab" } });
    settleInput();
    expect(status()).toHaveTextContent("Match 1 of 3");
    fireEvent.click(next());
    expect(status()).toHaveTextContent("Match 2 of 3");
    expect(screen.getByLabelText("Match 2 (empty)")).toHaveAttribute("aria-current", "true");
    fireEvent.click(previous());
    fireEvent.click(previous());
    expect(status()).toHaveTextContent("Match 3 of 3");
    expect(screen.getByLabelText("Match 3 (empty)")).toHaveAttribute("aria-current", "true");
    fireEvent.click(next());
    expect(status()).toHaveTextContent("Match 1 of 3");
    expect(screen.getByLabelText("Highlighted matches")).toHaveTextContent("ab");
  });

  it("navigates only the 1,000 displayed matches when results are truncated", () => {
    renderClient();
    fireEvent.change(screen.getByLabelText("Pattern"), { target: { value: "a" } });
    fireEvent.change(screen.getByLabelText("Test text"), { target: { value: "a".repeat(1001) } });
    settleInput();
    expect(status()).toHaveTextContent("Match 1 of 1000");
    expect(screen.getByRole("heading", { name: "More than 1,000 matches, showing the first 1,000" })).toBeInTheDocument();
    fireEvent.click(previous());
    expect(status()).toHaveTextContent("Match 1000 of 1000");
    expect(screen.getByLabelText("Match 1000")).toHaveAttribute("aria-current", "true");
    expect(screen.queryByLabelText("Match 1001")).not.toBeInTheDocument();
    fireEvent.click(next());
    expect(status()).toHaveTextContent("Match 1 of 1000");
  });

  it("scrolls the active highlight without stealing focus or reacting to replacement edits", () => {
    const scroll = vi.spyOn(HTMLElement.prototype, "scrollIntoView").mockImplementation(() => {});
    renderClient();
    scroll.mockClear();
    next().focus();
    fireEvent.click(next());
    expect(next()).toHaveFocus();
    expect(scroll).toHaveBeenLastCalledWith({ block: "nearest", inline: "nearest" });
    expect(scroll.mock.contexts.at(-1)).toBe(screen.getByLabelText("Match 2"));
    fireEvent.click(next());
    expect(scroll.mock.contexts.at(-1)).toBe(screen.getByLabelText("Match 1"));
    previous().focus();
    fireEvent.click(previous());
    expect(previous()).toHaveFocus();
    expect(scroll.mock.contexts.at(-1)).toBe(screen.getByLabelText("Match 2"));
    scroll.mockClear();
    changeInput("Replace with", "updated");
    expect(status()).toHaveTextContent("Match 2 of 2");
    expect(scroll).not.toHaveBeenCalled();
  });
});
