import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OutputPanel, TreeView } from "./OutputPanel";
import { ToastProvider } from "@/components/shared/Toast";

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

describe("JSON tree path selection", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("selects root, containers and primitive nodes without toggling expansion", () => {
    render(<TreeView output={'{"users":[{"email":"a@example.com"}]}'} forceOpen={null} />);

    const selectionButtons = screen
      .getAllByRole("button")
      .filter((button) => button.hasAttribute("aria-pressed"));
    const [rootSelection, usersSelection, itemSelection] = selectionButtons;
    expect(rootSelection).toHaveAccessibleName("{");
    expect(usersSelection).toHaveAccessibleName(/users.*\[/);
    const usersToggle = screen.getByRole("button", { name: "users" });

    fireEvent.click(usersSelection);
    expect(usersSelection).toHaveAttribute("aria-pressed", "true");
    expect(rootSelection).toHaveAttribute("aria-pressed", "false");
    expect(usersToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("status", { name: "Selected JSON path" })).toHaveTextContent("$.users");

    const itemToggle = screen.getByRole("button", { name: "item 0" });
    fireEvent.click(itemToggle);
    expect(itemToggle).toHaveAttribute("aria-expanded", "true");
    const emailSelection = screen.getByRole("button", { name: /email.*a@example\.com/ });
    expect(emailSelection).toHaveAccessibleName(/email.*a@example\.com/);
    fireEvent.click(emailSelection);
    expect(emailSelection).toHaveAttribute("aria-pressed", "true");
    expect(usersSelection).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(itemSelection);
    expect(itemSelection).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(rootSelection);
    expect(rootSelection).toHaveAttribute("aria-pressed", "true");
  });

  it("shows and copies the selected path exactly", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <ToastProvider>
        <TreeView output={'{"users":[{"email":"a@example.com"}]}'} forceOpen={null} />
      </ToastProvider>
    );

    const copy = screen.getByRole("button", { name: "Copy JSON path" });
    expect(copy).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "item 0" }));
    fireEvent.click(screen.getByRole("button", { name: /email.*a@example\.com/ }));
    expect(screen.getByRole("status", { name: "Selected JSON path" })).toHaveTextContent(
      "$.users[0].email"
    );
    expect(copy).toBeEnabled();

    fireEvent.click(copy);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("$.users[0].email"));
  });

  it("clears the selected path when the document changes", () => {
    const { rerender } = render(<TreeView output={'{"value":1}'} forceOpen={null} />);
    fireEvent.click(screen.getByRole("button", { name: /value.*1/ }));
    expect(screen.getByRole("status", { name: "Selected JSON path" })).toHaveTextContent("$.value");

    rerender(<TreeView output={'{"value":2}'} forceOpen={null} />);

    expect(screen.getByRole("status", { name: "Selected JSON path" })).toHaveTextContent(
      "Select a value in the tree"
    );
    expect(screen.getByRole("button", { name: "Copy JSON path" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /value.*2/ })).toHaveAttribute("aria-pressed", "false");

    rerender(<TreeView output={'{"value":1}'} forceOpen={null} />);
    expect(screen.getByRole("status", { name: "Selected JSON path" })).toHaveTextContent(
      "Select a value in the tree"
    );
    expect(screen.getByRole("button", { name: "Copy JSON path" })).toBeDisabled();
  });

  it("selects and displays escaped paths for special object keys", () => {
    render(<TreeView output={'{"a.b":{"0":["value"]}}'} forceOpen={null} />);
    const numericKeyToggle = screen.getByRole("button", { name: "0" });
    fireEvent.click(numericKeyToggle);
    const selected = screen.getByRole("button", { name: /value/ });
    expect(selected).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(selected);

    expect(screen.getByRole("status", { name: "Selected JSON path" })).toHaveTextContent(
      '$["a.b"]["0"][0]'
    );
  });
});
