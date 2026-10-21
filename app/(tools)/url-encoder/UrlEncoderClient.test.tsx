import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { UrlEncoderClient } from "./UrlEncoderClient";

const tab = (name: string) => screen.getByRole("tab", { name });

describe("UrlEncoderClient tabs", () => {
  // Vitest globals are off, so Testing Library does not clean up on its own.
  afterEach(cleanup);

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
});
