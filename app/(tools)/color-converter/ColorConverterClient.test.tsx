import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ColorConverterClient } from "./ColorConverterClient";
import { contrastRatio, parseColor } from "@/lib/color-utils";
import { useRegisterCommands } from "@/components/shared/CommandPalette";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("@/components/shared/CommandPalette", () => ({ useRegisterCommands: vi.fn() }));
vi.mock("@/components/shared/Toast", () => ({ useToast: () => ({ push }) }));
afterEach(cleanup);

describe("palette clipboard feedback", () => {
  it.each([
    ["hex", "#ff0000"],
    ["rgb", "rgb(255, 0, 0)"],
    ["hsl", "hsl(0, 100%, 50%)"],
  ])("reports %s copy results with the correct value", async (format, expected) => {
    push.mockClear();
    const writeText = vi.fn().mockRejectedValue(new Error("Clipboard denied"));
    const clipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    try {
      render(<ColorConverterClient />);
      fireEvent.change(screen.getByLabelText("Color input"), { target: { value: "#ff0000" } });
      const commands = vi.mocked(useRegisterCommands).mock.calls.at(-1)![1];
      const command = commands.find(({ id }) => id === `color:copy-${format}`)!;
      await expect(command.run()).resolves.toBeUndefined();
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText).toHaveBeenCalledWith(expected);
      expect(push).toHaveBeenCalledExactlyOnceWith("Could not copy — clipboard blocked", "error");
      push.mockClear();
      writeText.mockReset().mockResolvedValue(undefined);
      await command.run();
      expect(writeText).toHaveBeenCalledExactlyOnceWith(expected);
      expect(push).toHaveBeenCalledExactlyOnceWith(`Copied ${format.toUpperCase()} to clipboard`, "success");
    } finally {
      if (clipboard) Object.defineProperty(navigator, "clipboard", clipboard);
      else Reflect.deleteProperty(navigator, "clipboard");
    }
  });
});

function failingPair() {
  render(<ColorConverterClient />);
  const foreground = screen.getByLabelText("Text / Foreground");
  const background = screen.getByLabelText("Surface / Background");
  fireEvent.change(foreground, { target: { value: "#777777" } });
  fireEvent.change(background, { target: { value: "#ffffff" } });
  return { foreground, background };
}

describe("accessible foreground suggestions", () => {
  it.each(["#F26DF0", "rgb(242, 109, 240)"])("shows and applies HEX for %s input", (input) => {
    const { foreground, background } = failingPair();
    fireEvent.change(foreground, { target: { value: input } });
    fireEvent.click(screen.getByRole("button", { name: "Suggest accessible foreground" }));
    expect(screen.getByText("#d013ce", { selector: "code" })).toBeInTheDocument();
    expect(foreground).toHaveValue(input);
    fireEvent.click(screen.getByRole("button", { name: "Apply suggested foreground" }));
    expect(foreground).toHaveValue("#d013ce");
    expect(background).toHaveValue("#ffffff");
  });

  it("keeps typed HSL hue and saturation when showing and applying a suggestion", () => {
    const { foreground } = failingPair();
    fireEvent.change(foreground, { target: { value: "HSL(210.5, 40.5%, 60.5%)" } });
    fireEvent.click(screen.getByRole("button", { name: "Suggest accessible foreground" }));
    const suggested = screen.getByText(/^hsl\(210\.5, 40\.5%,/, { selector: "code" }).textContent;
    fireEvent.click(screen.getByRole("button", { name: "Apply suggested foreground" }));
    expect(foreground).toHaveValue(suggested);
  });

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

describe("contrast color pickers", () => {
  it("keep the alpha of the current colors", () => {
    const { foreground, background } = failingPair();
    fireEvent.change(foreground, { target: { value: "#00000080" } });
    fireEvent.change(background, { target: { value: "#ffffff80" } });
    fireEvent.change(screen.getByLabelText("Foreground color picker"), { target: { value: "#ff0000" } });
    fireEvent.change(screen.getByLabelText("Background color picker"), { target: { value: "#0000ff" } });
    expect(foreground).toHaveValue("#ff000080");
    expect(background).toHaveValue("#0000ff80");
  });
});
