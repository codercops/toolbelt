import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DiffPanel } from "./DiffPanel";
afterEach(cleanup);
describe("JSON diff panel", () => {
  it("compares, swaps and clears stale results on invalid input", () => {
    render(<DiffPanel leftInput={'{"count":1}'} />);
    const updated = screen.getByRole("textbox", { name: "Updated JSON" });
    fireEvent.change(updated, { target: { value: '{"count":2}' } });
    expect(screen.getByText("$.count")).toBeInTheDocument();
    expect(screen.getByText("Changed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Swap inputs" }));
    expect(screen.getByRole("textbox", { name: "Original JSON" })).toHaveValue('{"count":2}');
    fireEvent.change(updated, { target: { value: '{' } });
    expect(screen.getByRole("alert")).toHaveTextContent("Updated JSON");
    expect(screen.queryByText("$.count")).not.toBeInTheDocument();
  });
  it("lets users choose whether to ignore object key order", () => {
    render(<DiffPanel leftInput={'{"a":1,"b":2}'} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Updated JSON" }), { target: { value: '{"b":2,"a":1}' } });
    expect(screen.getByText("Documents are equivalent")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Ignore key order" }));
    expect(screen.getByText("Changed")).toBeInTheDocument();
  });
});
