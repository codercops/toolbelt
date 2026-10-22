import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NumberInput } from "./NumberInput";

function ControlledInput({ initialValue }: { initialValue: number }) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <NumberInput value={value} onChange={setValue} ariaLabel="Amount" />
      <output data-testid="amount">{value}</output>
      <button onClick={() => setValue(42)}>Load example</button>
      <button onClick={() => setValue(initialValue)}>Reset</button>
    </>
  );
}

describe("NumberInput", () => {
  afterEach(cleanup);

  it.each([
    { initialValue: 2000, entry: "-150", expected: -150 },
    { initialValue: 1, entry: ".5", expected: 0.5 },
  ])("replaces $initialValue with $entry", ({ initialValue, entry, expected }) => {
    render(<ControlledInput initialValue={initialValue} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: entry[0] } });
    expect(input).toHaveValue(entry[0]);
    for (const character of entry.slice(1)) {
      fireEvent.change(input, { target: { value: (input as HTMLInputElement).value + character } });
    }
    expect(input).toHaveValue(entry);
    expect(screen.getByTestId("amount")).toHaveTextContent(String(expected));
    fireEvent.blur(input);
    expect(input).toHaveValue(String(expected));
    expect(screen.getByTestId("amount")).toHaveTextContent(String(expected));
  });

  it.each(["", "-", ".", "-."])("preserves partial entry %j until blur", (entry) => {
    render(<ControlledInput initialValue={2000} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: entry } });
    expect(input).toHaveValue(entry);
    expect(screen.getByTestId("amount")).toHaveTextContent("0");
    fireEvent.blur(input);
    expect(input).toHaveValue("0");
  });

  it("syncs outside changes even after a partial entry", () => {
    render(<ControlledInput initialValue={2000} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "-" } });
    fireEvent.click(screen.getByRole("button", { name: "Load example" }));
    expect(input).toHaveValue("42");
    fireEvent.change(input, { target: { value: "." } });
    expect(input).toHaveValue(".");
    fireEvent.click(screen.getByRole("button", { name: "Load example" }));
    expect(input).toHaveValue("42");
  });

  it("syncs consecutive outside changes back to the initial value", () => {
    render(<ControlledInput initialValue={0} />);
    fireEvent.click(screen.getByRole("button", { name: "Load example" }));
    expect(screen.getByRole("textbox")).toHaveValue("42");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByRole("textbox")).toHaveValue("0");
  });
});
