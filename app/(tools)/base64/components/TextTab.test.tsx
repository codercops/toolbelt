import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { TextTab } from "./TextTab";

function pasteIntoTextTab(text: string) {
  render(
    <ToastProvider>
      <TextTab />
    </ToastProvider>,
  );
  const input = screen.getAllByRole("textbox")[0];
  fireEvent.paste(input, { clipboardData: { getData: () => text } });
}

const switchedNotice = () => screen.queryByText(/Looks like base64/);

describe("TextTab paste", () => {
  // Vitest globals are off, so Testing Library does not clean up on its own.
  afterEach(cleanup);

  it.each(["password123", "hello-world", "2024-01-15", "user_id_123"])(
    "stays in Encode when %s is pasted",
    (text) => {
      pasteIntoTextTab(text);
      expect(switchedNotice()).not.toBeInTheDocument();
      expect(screen.getByText("Base64 output")).toBeInTheDocument();
    },
  );

  it.each(["SGVsbG8=", "aGVsbG8gd29ybGQ"])("switches to Decode when base64 of text %s is pasted", (b64) => {
    pasteIntoTextTab(b64);
    expect(switchedNotice()).toBeInTheDocument();
    expect(screen.getByText("Decoded text")).toBeInTheDocument();
  });
});

describe("TextTab switches", () => {
  afterEach(cleanup);

  const renderTab = () =>
    render(
      <ToastProvider>
        <TextTab />
      </ToastProvider>,
    );

  it("names the direction switch and presses only the selected direction", () => {
    renderTab();
    expect(screen.getByRole("group", { name: "Direction" })).toBeInTheDocument();
    const encode = screen.getByRole("button", { name: "Text → Base64" });
    const decode = screen.getByRole("button", { name: "Base64 → Text" });
    expect(encode).toHaveAttribute("type", "button");
    expect(encode).toHaveAttribute("aria-pressed", "true");
    expect(decode).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(decode);
    expect(encode).toHaveAttribute("aria-pressed", "false");
    expect(decode).toHaveAttribute("aria-pressed", "true");
  });

  it("names the variant switch and presses only the selected variant", () => {
    renderTab();
    expect(screen.getByRole("group", { name: "Base64 variant" })).toBeInTheDocument();
    const standard = screen.getByRole("button", { name: "Standard" });
    const urlSafe = screen.getByRole("button", { name: "URL-safe" });
    expect(standard).toHaveAttribute("aria-pressed", "true");
    expect(urlSafe).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(urlSafe);
    expect(standard).toHaveAttribute("aria-pressed", "false");
    expect(urlSafe).toHaveAttribute("aria-pressed", "true");
    // The styling hook stays in step with the state.
    expect(urlSafe).toHaveAttribute("data-active", "true");
  });

  it("disables Swap and preserves invalid input when the shortcut runs", async () => {
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Base64 → Text" }));
    const input = screen.getByRole("textbox", { name: "Base64 to decode" });
    fireEvent.change(input, { target: { value: "Hello world, how are you?" } });

    expect(await screen.findByText(/Invalid base64/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Swap direction" })).toBeDisabled();

    fireEvent.keyDown(input, { key: "s", ctrlKey: true, shiftKey: true });

    expect(input).toHaveValue("Hello world, how are you?");
    expect(screen.getByRole("button", { name: "Base64 → Text" })).toHaveAttribute("aria-pressed", "true");
  });

  it("exposes invalid base64 through an alert", async () => {
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Base64 → Text" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Base64 to decode" }), {
      target: { value: "SGVs!bG8=" },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(/Invalid base64/i);
  });

  it("swaps a valid conversion result", async () => {
    renderTab();
    fireEvent.change(screen.getByRole("textbox", { name: "Text to encode" }), {
      target: { value: "Hello world" },
    });

    expect(await screen.findByText("SGVsbG8gd29ybGQ=")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Swap direction" }));

    expect(screen.getByRole("button", { name: "Base64 → Text" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("textbox", { name: "Base64 to decode" })).toHaveValue("SGVsbG8gd29ybGQ=");
    await waitFor(() => expect(screen.getByText("Hello world")).toBeInTheDocument());
  });

  it("names the output copy buttons by what they copy", async () => {
    renderTab();
    fireEvent.change(screen.getByRole("textbox", { name: "Text to encode" }), {
      target: { value: "Hello world" },
    });

    expect(await screen.findByText("SGVsbG8gd29ybGQ=")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy Base64 output" })).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Copy as code literal/).closest("button")!);
    expect(screen.getByRole("button", { name: "Copy javascript code literal" })).toBeInTheDocument();
  });
});

describe("TextTab code-literal disclosure", () => {
  afterEach(cleanup);

  it("keeps its name stable and connects both states to the controlled panel", async () => {
    render(
      <ToastProvider>
        <TextTab />
      </ToastProvider>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Text to encode" }), { target: { value: "Hello" } });
    const toggle = await screen.findByRole("button", { name: "Copy as code literal" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "base64-code-literal-panel");
    expect(screen.getByText("click to expand")).toHaveAttribute("aria-hidden", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText("click to expand")).not.toBeInTheDocument();
    const panel = document.getElementById("base64-code-literal-panel");
    expect(panel).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-controls", panel?.id);
    expect(screen.getByRole("button", { name: "Copy as code literal" })).toBe(toggle);
    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute("aria-expanded", "false"));
    expect(document.getElementById("base64-code-literal-panel")).not.toBeInTheDocument();
  });
});
