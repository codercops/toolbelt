import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { Toolbar } from "./Toolbar";

const noop = () => {};

function renderToolbar(indent: 2 | 4, onIndentChange = vi.fn()) {
  const props = {
    onFormat: noop,
    onMinify: noop,
    onValidate: noop,
    onClear: noop,
    onDownload: noop,
    onLoadSample: noop,
    onSort: noop,
    onToggleDiff: noop,
    diffOpen: false,
    onToggleStats: noop,
    statsOpen: false,
    onFind: noop,
    output: "",
    json5: false,
    onJson5Toggle: noop,
  };
  const ui = (i: 2 | 4) => (
    <ToastProvider>
      <Toolbar {...props} indent={i} onIndentChange={onIndentChange} />
    </ToastProvider>
  );
  const view = render(ui(indent));
  return { onIndentChange, rerender: (i: 2 | 4) => view.rerender(ui(i)) };
}

describe("Toolbar indent switch", () => {
  // Vitest globals are off, so Testing Library does not clean up on its own.
  afterEach(cleanup);

  it("presses only the selected indent", () => {
    const { rerender } = renderToolbar(2);
    expect(screen.getByRole("group", { name: "Indent size" })).toBeInTheDocument();
    const two = screen.getByRole("button", { name: "2 sp" });
    const four = screen.getByRole("button", { name: "4 sp" });
    expect(two).toHaveAttribute("type", "button");
    expect(two).toHaveAttribute("aria-pressed", "true");
    expect(four).toHaveAttribute("aria-pressed", "false");
    rerender(4);
    expect(two).toHaveAttribute("aria-pressed", "false");
    expect(four).toHaveAttribute("aria-pressed", "true");
  });

  it("asks for the indent that was clicked", () => {
    const { onIndentChange } = renderToolbar(2);
    fireEvent.click(screen.getByRole("button", { name: "4 sp" }));
    expect(onIndentChange).toHaveBeenCalledWith(4);
  });

  it("names the load example button and omits the placeholder text", () => {
    renderToolbar(2);
    expect(screen.getByRole("button", { name: "Load example" })).toHaveAttribute(
      "aria-label",
      "Load example",
    );
    expect(screen.queryByText("legend placeholder")).not.toBeInTheDocument();
  });
});
