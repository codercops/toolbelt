import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ConversionPanel } from "./ConversionPanel";

describe("ConversionPanel accessibility", () => {
  afterEach(cleanup);

  it("reports the expanded state and controlled panel", () => {
    render(<ConversionPanel input='{"name":"Ada"}' />);

    const toggle = screen.getByRole("button", {
      name: /conversions.*validate.*query/i,
    });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "json-conversions-panel");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("json-conversions-panel")).toBeInTheDocument();
  });

  it("reports the selected conversion mode", () => {
    render(<ConversionPanel input='{"name":"Ada"}' />);
    fireEvent.click(
      screen.getByRole("button", { name: /conversions.*validate.*query/i })
    );

    expect(screen.getByRole("group", { name: "Conversion mode" })).toBeInTheDocument();
    const typeScript = screen.getByRole("button", { name: "TypeScript" });
    const csv = screen.getByRole("button", { name: "CSV" });

    expect(typeScript).toHaveAttribute("aria-pressed", "true");
    expect(csv).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(csv);

    expect(typeScript).toHaveAttribute("aria-pressed", "false");
    expect(csv).toHaveAttribute("aria-pressed", "true");
  });

  it("names the target language combobox", () => {
    render(<ConversionPanel input='{"name":"Ada"}' />);
    fireEvent.click(
      screen.getByRole("button", { name: /conversions.*validate.*query/i })
    );
    fireEvent.click(screen.getByRole("button", { name: "Escape for code" }));

    expect(
      screen.getByRole("combobox", { name: "Target language" })
    ).toBeInTheDocument();
  });
});
