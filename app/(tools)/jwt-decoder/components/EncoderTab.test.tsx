import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { encodeJwt } from "@/lib/jwt-utils";
import { EncoderTab } from "./EncoderTab";

vi.mock("@/lib/jwt-utils", () => ({
  encodeJwt: vi.fn(),
}));

describe("EncoderTab accessible labels", () => {
  afterEach(cleanup);

  it("gives the algorithm dropdown an accessible name", () => {
    render(
      <ToastProvider>
        <EncoderTab />
      </ToastProvider>
    );

    expect(
      screen.getByRole("combobox", { name: "Algorithm" })
    ).toBeInTheDocument();
  });

  it("gives the template dropdown an accessible name", () => {
    render(
      <ToastProvider>
        <EncoderTab />
      </ToastProvider>
    );

    expect(
      screen.getByRole("combobox", { name: "Payload template" })
    ).toBeInTheDocument();
  });
});

describe("EncoderTab payload validation", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.mocked(encodeJwt).mockResolvedValue("header.payload.signature");
  });

  it.each(["[1, 2, 3]", '"hello"', "42", "true", "null"])(
    "rejects the non-object JSON payload %s without generating a token",
    async (payload) => {
      render(
        <ToastProvider>
          <EncoderTab />
        </ToastProvider>
      );
      fireEvent.change(screen.getByRole("textbox", { name: "JWT payload" }), {
        target: { value: payload },
      });

      fireEvent.click(screen.getByRole("button", { name: "Generate JWT" }));

      expect(await screen.findByText("The payload must be a JSON object")).toBeInTheDocument();
      expect(encodeJwt).not.toHaveBeenCalled();
      expect(screen.getByText("Signed JWT will appear here.")).toBeInTheDocument();
    },
  );

  it("generates a token for an object payload", async () => {
    render(
      <ToastProvider>
        <EncoderTab />
      </ToastProvider>
    );
    fireEvent.change(screen.getByRole("textbox", { name: "JWT payload" }), {
      target: { value: '{"sub":"1234"}' },
    });

    fireEvent.click(screen.getByRole("button", { name: "Generate JWT" }));

    expect(await screen.findByText("Length · 24 chars")).toBeInTheDocument();
    expect(encodeJwt).toHaveBeenCalledWith(
      {},
      { sub: "1234" },
      "your-256-bit-secret",
      "HS256",
    );
  });
});
