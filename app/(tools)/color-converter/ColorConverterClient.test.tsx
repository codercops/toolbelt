import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ColorConverterClient } from "./ColorConverterClient";
import { contrastRatio, parseColor } from "@/lib/color-utils";

vi.mock("@/components/shared/CommandPalette", () => ({ useRegisterCommands: vi.fn() }));
vi.mock("@/components/shared/Toast", () => ({ useToast: () => ({ push: vi.fn() }) }));
afterEach(cleanup);

function failingPair() {
  render(<ColorConverterClient />);
  const foreground = screen.getByLabelText("Text / Foreground");
  const background = screen.getByLabelText("Surface / Background");
  fireEvent.change(foreground, { target: { value: "#777777" } });
  fireEvent.change(background, { target: { value: "#ffffff" } });
  return { foreground, background };
}

describe("accessible foreground suggestions", () => {
  it("previews without changing inputs, then applies only the foreground", () => {
    const { foreground, background } = failingPair();
    fireEvent.click(screen.getByRole("button", { name: "Suggest accessible foreground" }));
    expect(foreground).toHaveValue("#777777");
    expect(background).toHaveValue("#ffffff");
    expect(screen.getByText("Sample text with the suggested foreground.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Apply suggested foreground" }));
    expect(background).toHaveValue("#ffffff");
    const fg = parseColor((foreground as HTMLInputElement).value);
    const bg = parseColor((background as HTMLInputElement).value);
    if (!fg.ok || !bg.ok) throw new Error("Invalid color");
    expect(contrastRatio(fg.value, bg.value)).toBeGreaterThanOrEqual(4.5);
    expect(screen.getByText(/No adjustment needed/)).toBeInTheDocument();
  });

  it("removes a stale preview when either input changes", () => {
    const { background } = failingPair();
    fireEvent.click(screen.getByRole("button", { name: "Suggest accessible foreground" }));
    fireEvent.change(background, { target: { value: "#eeeeee" } });
    expect(screen.queryByRole("button", { name: "Apply suggested foreground" })).not.toBeInTheDocument();
  });

  it.each(["invalid", "#ffffff80"])("explains unavailable suggestions for %s", (value) => {
    const { foreground } = failingPair();
    fireEvent.change(foreground, { target: { value } });
    expect(screen.queryByRole("button", { name: "Suggest accessible foreground" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(value === "invalid" ? "Enter valid" : "require opaque");
  });
});
