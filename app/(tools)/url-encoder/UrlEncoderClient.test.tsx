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
    expect(screen.getByRole("alert")).toHaveTextContent(/Malformed percent-encoding/);
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

  it("names the output copy button by direction and each query parameter copy button", () => {
    render(<UrlEncoderClient />);
    fireEvent.change(screen.getByRole("textbox", { name: "Text or URL to encode" }), {
      target: { value: "https://example.com/?page=2&q=hello" },
    });

    expect(screen.getByRole("button", { name: "Copy encoded output" })).toHaveTextContent("Copy");
    expect(screen.getByRole("button", { name: "Copy value of page" })).toHaveTextContent("Copy");
    expect(screen.getByRole("button", { name: "Copy value of q" })).toHaveTextContent("Copy");

    fireEvent.click(tab("Decode"));

    expect(screen.queryByRole("button", { name: "Copy encoded output" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy decoded output" })).toHaveTextContent("Copy");
  });

  it.each([
    ["?tag=react&tag=typescript", ["react", "typescript"]],
    ["?tag=react&tag=react", ["react", "react"]],
    ["?tag=&tag=typescript", ["", "typescript"]],
    ["?tag=a&%74ag=b", ["a", "b"]],
  ])("flags repeated parameters in %s", (query, values) => {
    render(<UrlEncoderClient />);
    fireEvent.change(screen.getByRole("textbox", { name: "Text or URL to encode" }), {
      target: { value: `https://example.com/${query}` },
    });
    expect(screen.getAllByText("Repeated key")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("1 repeated key: tag.");
    expect(screen.getByText(/not necessarily errors/)).toBeInTheDocument();
    const rows = screen.getAllByRole("button", { name: "Copy value of tag" });
    expect(rows.map((button) => button.parentElement?.querySelector("span.text-\\[var\\(--fg\\)\\]")?.textContent)).toEqual(values);
  });

  it("keeps case-sensitive and unique keys unflagged and labels empty names", () => {
    render(<UrlEncoderClient />);
    const input = screen.getByRole("textbox", { name: "Text or URL to encode" });
    fireEvent.change(input, { target: { value: "https://example.com/?Tag=a&tag=b&=empty" } });
    expect(screen.queryByText("Repeated key")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy value of (empty name)" }).parentElement).toHaveTextContent("(empty name) = empty");
    fireEvent.change(input, { target: { value: "https://example.com/?=first&=second" } });
    expect(screen.getAllByText("Repeated key")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("1 repeated key: (empty name).");
  });

  it("updates repeated-key indicators when the URL changes", () => {
    render(<UrlEncoderClient />);
    const input = screen.getByRole("textbox", { name: "Text or URL to encode" });
    fireEvent.change(input, { target: { value: "https://example.com/?tag=a&tag=b" } });
    expect(screen.getAllByText("Repeated key")).toHaveLength(2);
    fireEvent.change(input, { target: { value: "https://example.com/?tag=a&sort=b" } });
    expect(screen.queryByText("Repeated key")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
