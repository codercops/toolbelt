import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UrlEncoderClient } from "./UrlEncoderClient";

const commandRegistry = vi.hoisted(() => ({
  commands: [] as { id: string; run: () => void }[],
}));

vi.mock("@/components/shared/CommandPalette", () => ({
  useRegisterCommands: (_scope: string, commands: { id: string; run: () => void }[]) => {
    commandRegistry.commands = commands;
  },
}));

const tab = (name: string) => screen.getByRole("tab", { name });

describe("UrlEncoderClient tabs", () => {
  // Vitest globals are off, so Testing Library does not clean up on its own.
  afterEach(() => {
    cleanup();
    commandRegistry.commands = [];
  });

  it("marks only the selected direction tab", () => {
    render(<UrlEncoderClient />);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(tab("Encode")).toHaveAttribute("aria-selected", "true");
    expect(tab("Encode")).toHaveAttribute("tabindex", "0");
    expect(tab("Decode")).toHaveAttribute("aria-selected", "false");
    expect(tab("Decode")).toHaveAttribute("tabindex", "-1");
  });

  it("moves between tabs with the arrow, Home and End keys", () => {
    render(<UrlEncoderClient />);
    fireEvent.keyDown(tab("Encode"), { key: "ArrowRight" });
    expect(tab("Decode")).toHaveAttribute("aria-selected", "true");
    expect(tab("Decode")).toHaveFocus();
    fireEvent.keyDown(tab("Decode"), { key: "ArrowLeft" });
    expect(tab("Encode")).toHaveAttribute("aria-selected", "true");
    expect(tab("Encode")).toHaveFocus();
    fireEvent.keyDown(tab("Encode"), { key: "End" });
    expect(tab("Decode")).toHaveFocus();
    fireEvent.keyDown(tab("Decode"), { key: "Home" });
    expect(tab("Encode")).toHaveFocus();
  });

  it("labels the panel with the selected tab", () => {
    render(<UrlEncoderClient />);
    expect(screen.getByRole("tabpanel", { name: "Encode" })).toBeInTheDocument();
    fireEvent.click(tab("Decode"));
    expect(screen.getByRole("tabpanel", { name: "Decode" })).toBeInTheDocument();
  });

  it("presses only the selected encode mode", () => {
    render(<UrlEncoderClient />);
    const group = screen.getByRole("group", { name: "Encode mode" });
    expect(group).toBeInTheDocument();
    const component = screen.getByRole("button", { name: "Component" });
    const fullUrl = screen.getByRole("button", { name: "Full URL" });
    expect(component).toHaveAttribute("aria-pressed", "true");
    expect(fullUrl).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(fullUrl);
    expect(component).toHaveAttribute("aria-pressed", "false");
    expect(fullUrl).toHaveAttribute("aria-pressed", "true");
  });

  it("disables Swap and preserves invalid input when the command runs", async () => {
    render(<UrlEncoderClient />);
    fireEvent.click(tab("Decode"));
    const input = screen.getByRole("textbox", { name: "Percent-encoded text to decode" });
    fireEvent.change(input, { target: { value: "Save 50% today" } });

    expect(await screen.findByText(/Malformed percent-encoding/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Swap direction" })).toBeDisabled();

    commandRegistry.commands.find((command) => command.id === "url:swap")?.run();

    expect(input).toHaveValue("Save 50% today");
    expect(tab("Decode")).toHaveAttribute("aria-selected", "true");
  });

  it("swaps a valid conversion result", async () => {
    render(<UrlEncoderClient />);
    fireEvent.click(tab("Decode"));
    fireEvent.change(screen.getByRole("textbox", { name: "Percent-encoded text to decode" }), {
      target: { value: "Hello%20world" },
    });

    expect(await screen.findByText("Hello world")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Swap direction" }));

    expect(tab("Encode")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("textbox", { name: "Text or URL to encode" })).toHaveValue("Hello world");
    await waitFor(() => expect(screen.getByText("Hello%20world")).toBeInTheDocument());
  });
});
