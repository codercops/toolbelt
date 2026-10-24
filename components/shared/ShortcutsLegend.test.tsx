import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ShortcutsLegend } from "./ShortcutsLegend";

const shortcuts = [
  { keys: ["Ctrl", "S"], label: "Save" },
  { keys: ["Ctrl", "Z"], label: "Undo" },
];

describe("ShortcutsLegend", () => {
  afterEach(cleanup);

  it("renders the button with correct aria attributes when closed", () => {
    render(<ShortcutsLegend shortcuts={shortcuts} />);
    const button = screen.getByRole("button", { name: /keyboard shortcuts/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls");
  });

  it("opens the popup on button click and updates aria-expanded", async () => {
    render(<ShortcutsLegend shortcuts={shortcuts} />);
    const button = screen.getByRole("button", { name: /keyboard shortcuts/i });
    const popupId = button.getAttribute("aria-controls")!;

    fireEvent.click(button);

    await waitFor(() => {
      const popup = document.getElementById(popupId);
      expect(popup).toBeInTheDocument();
      expect(popup).toHaveAttribute("role", "dialog");
    });

    await waitFor(() => {
      const buttonAfter = screen.getByRole("button", { name: /keyboard shortcuts/i });
      expect(buttonAfter).toHaveAttribute("aria-expanded", "true");
    });
  });

  it("closes the popup on Escape and returns focus to the button", async () => {
    render(<ShortcutsLegend shortcuts={shortcuts} />);
    const button = screen.getByRole("button", { name: /keyboard shortcuts/i });
    const popupId = button.getAttribute("aria-controls")!;

    fireEvent.click(button);
    await waitFor(() => expect(document.getElementById(popupId)).toBeInTheDocument());

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      const popup = document.getElementById(popupId);
      expect(popup).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const buttonAfter = screen.getByRole("button", { name: /keyboard shortcuts/i });
      expect(buttonAfter).toHaveAttribute("aria-expanded", "false");
    });
    expect(button).toHaveFocus();
  });

  it("closes the popup on outside click", async () => {
    render(<ShortcutsLegend shortcuts={shortcuts} />);
    const button = screen.getByRole("button", { name: /keyboard shortcuts/i });

    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      const buttonAfter = screen.getByRole("button", { name: /keyboard shortcuts/i });
      expect(buttonAfter).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("renders all shortcuts with their keys and labels", () => {
    render(<ShortcutsLegend shortcuts={shortcuts} />);
    const button = screen.getByRole("button", { name: /keyboard shortcuts/i });
    fireEvent.click(button);

    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Undo")).toBeInTheDocument();
    const popup = screen.getByRole("dialog");
    expect(popup.textContent).toContain("Ctrl");
    expect(popup.textContent).toContain("S");
    expect(popup.textContent).toContain("Z");
  });

  it("has aria-controls pointing to the popup id", () => {
    render(<ShortcutsLegend shortcuts={shortcuts} />);
    const button = screen.getByRole("button", { name: /keyboard shortcuts/i });
    const controls = button.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    expect(controls).toMatch(/^shortcuts-popup-/);
  });

  it("labels the dialog with its heading", async () => {
    render(<ShortcutsLegend shortcuts={shortcuts} />);
    const button = screen.getByRole("button", { name: /keyboard shortcuts/i });
    fireEvent.click(button);

    const dialog = await screen.findByRole("dialog");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();

    const heading = document.getElementById(labelledBy!);
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Keyboard shortcuts");
  });

  it("keeps aria-controls in sync with the rendered popup id", async () => {
    render(<ShortcutsLegend shortcuts={shortcuts} />);
    const button = screen.getByRole("button", { name: /keyboard shortcuts/i });
    fireEvent.click(button);

    const dialog = await screen.findByRole("dialog");
    expect(button.getAttribute("aria-controls")).toBe(dialog.id);
  });
});