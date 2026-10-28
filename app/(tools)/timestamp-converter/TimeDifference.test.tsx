import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TimeDifference } from "./TimeDifference";

describe("TimeDifference", () => {
  afterEach(cleanup);

  it("swaps input values and formats and reverses the result", () => {
    render(<TimeDifference />);
    fireEvent.change(screen.getByRole("combobox", { name: "End format" }), { target: { value: "ms" } });
    fireEvent.click(screen.getByRole("button", { name: "Swap start and end" }));
    expect(screen.getByRole("textbox", { name: "Start time" })).toHaveValue("86400");
    expect(screen.getByRole("combobox", { name: "Start format" })).toHaveValue("ms");
    expect(screen.getByText("-86400 ms")).toBeInTheDocument();
    expect(screen.getByText(/end time is earlier/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy time difference" })).toBeInTheDocument();
  });

  it("removes stale results and copy action when an input becomes invalid", () => {
    render(<TimeDifference />);
    expect(screen.getByText("86400000 ms")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Start time" }), { target: { value: "" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Start: Enter");
    expect(screen.getByRole("textbox", { name: "Start time" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("86400000 ms")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy time difference" })).not.toBeInTheDocument();
  });
});
