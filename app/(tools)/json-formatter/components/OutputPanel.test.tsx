import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OutputPanel, TreeView } from "./OutputPanel";

describe("OutputPanel view switch", () => {
  // Vitest globals are off, so Testing Library does not clean up on its own.
  afterEach(cleanup);

  it("presses only the selected view", () => {
    render(<OutputPanel output={'{\n  "a": 1\n}'} />);
    expect(screen.getByRole("group", { name: "View mode" })).toBeInTheDocument();
    const code = screen.getByRole("button", { name: "Code" });
    const tree = screen.getByRole("button", { name: "Tree" });
    expect(code).toHaveAttribute("aria-pressed", "true");
    expect(tree).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(tree);
    expect(code).toHaveAttribute("aria-pressed", "false");
    expect(tree).toHaveAttribute("aria-pressed", "true");
  });
});

describe("tree view accessible names", () => {
  afterEach(cleanup);

  it("names each node toggle after its key and reports the expansion state", () => {
    render(<TreeView output={'{"user":{"id":1},"tags":[1,2]}'} forceOpen={null} />);

    const root = screen.getByRole("button", { name: "root" });
    expect(root).toHaveAttribute("aria-expanded", "true");

    const user = screen.getByRole("button", { name: "user" });
    const tags = screen.getByRole("button", { name: "tags" });
    expect(user).toHaveAttribute("aria-expanded", "true");
    expect(tags).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(user);
    expect(user).toHaveAttribute("aria-expanded", "false");
  });

  it("names array items by index instead of root", () => {
    render(<TreeView output={'[{"a":{"b":1}},[2,[3]]]'} forceOpen={null} />);

    expect(screen.getByRole("button", { name: "root" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "item 0" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "item 1" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "a" })).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: "root" })).toHaveLength(1);
  });

  it("names the toolbar buttons Expand all and Collapse all", () => {
    render(<OutputPanel output={'{"a":1}'} />);
    fireEvent.click(screen.getByRole("button", { name: "Tree" }));

    expect(screen.getByRole("button", { name: "Expand all" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse all" })).toBeInTheDocument();
  });
});
