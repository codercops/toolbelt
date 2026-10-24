import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { EncodingsTab } from "./EncodingsTab";

describe("EncodingsTab copy buttons", () => {
  afterEach(cleanup);

  it("names encoded output and hash copy buttons", async () => {
    render(
      <ToastProvider>
        <EncodingsTab />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Text to encode" }), {
      target: { value: "Hello" },
    });

    expect(await screen.findByRole("button", { name: "Copy Base32 (RFC 4648)" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Copy SHA256" })).toBeInTheDocument();
  });
});
