import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { UuidGeneratorClient } from "./UuidGeneratorClient";

const mockWriteText = vi.fn().mockResolvedValue(undefined);
let randomValue = 0;

function renderClient() {
  return render(
    <ToastProvider>
      <UuidGeneratorClient />
    </ToastProvider>,
  );
}

describe("UuidGeneratorClient", () => {
  beforeEach(() => {
    randomValue = 0;
    vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation((array) => {
      if (!(array instanceof Uint8Array)) throw new TypeError("Expected a UUID byte array");
      array.fill(randomValue++);
      return array;
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
    mockWriteText.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("generates v4 UUIDs by default and allows switching to v7", () => {
    renderClient();
    fireEvent.click(screen.getByRole("button", { name: "Generate UUIDs" }));
    expect(screen.getByText("00000000-0000-4000-8000-000000000000")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "UUID v7" }));
    fireEvent.click(screen.getByRole("button", { name: "Generate UUIDs" }));
    expect(screen.getByRole("list", { name: "Generated UUIDs" })).toHaveTextContent(
      /-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-/i,
    );
  });

  it("generates the requested quantity and applies formatting toggles", () => {
    renderClient();
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2" } });
    fireEvent.click(screen.getByLabelText("Uppercase"));
    fireEvent.click(screen.getByLabelText("No hyphens"));
    fireEvent.click(screen.getByRole("button", { name: "Generate UUIDs" }));

    expect(screen.getByRole("heading", { name: "Generated UUIDs (2)" })).toBeInTheDocument();
    expect(screen.getByText("00000000000040008000000000000000")).toBeInTheDocument();
    expect(screen.getByText("01010101010141018101010101010101")).toBeInTheDocument();
  });

  it("rejects quantities outside 1 to 100", () => {
    renderClient();
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "101" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate UUIDs" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Choose a quantity from 1 to 100.");
  });

  it("generates the maximum batch of 100 UUIDs", () => {
    renderClient();
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate UUIDs" }));

    expect(screen.getByRole("list", { name: "Generated UUIDs" }).children).toHaveLength(100);
  });

  it("copies the complete generated batch", async () => {
    renderClient();
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate UUIDs" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy all" }));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        "00000000-0000-4000-8000-000000000000\n01010101-0101-4101-8101-010101010101",
      );
    });
  });

  it("shows recognized variant names for standard and reserved UUIDs", () => {
    renderClient();
    fireEvent.change(screen.getByLabelText("Inspect a UUID"), {
      target: { value: "018bcfe5-6800-7000-8000-000000000000" },
    });
    expect(screen.getByText("RFC 9562")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Inspect a UUID"), {
      target: { value: "00000000-0000-0000-0000-000000000000" },
    });
    expect(screen.getByText("Nil UUID (version 0)")).toBeInTheDocument();
    expect(screen.getByText("NCS (reserved)")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Inspect a UUID"), {
      target: { value: "00000000-0000-4000-C000-000000000000" },
    });
    expect(screen.getByText("Microsoft (reserved)")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Inspect a UUID"), {
      target: { value: "00000000-0000-4000-E000-000000000000" },
    });
    expect(screen.getByText("Future (reserved)")).toBeInTheDocument();
  });

  it("inspects v7 timestamps and malformed input", () => {
    renderClient();
    fireEvent.change(screen.getByLabelText("Inspect a UUID"), {
      target: { value: "018bcfe5-6800-7000-8000-000000000000" },
    });
    expect(screen.getByText("Version 7")).toBeInTheDocument();
    expect(screen.getByText(/1700000000000 ms/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Inspect a UUID"), {
      target: { value: "invalid" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid UUID");
  });
});
