import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_GST_SENDER, emptyGstInvoice, type GstInvoice } from "@/lib/gst-invoice-types";
import { GstInvoiceGeneratorClient } from "./GstInvoiceGeneratorClient";

const INVOICES_KEY = "cc-gst-invoices";

function savedInvoice(number: string, clientName: string): GstInvoice {
  const invoice = emptyGstInvoice(DEFAULT_GST_SENDER, number);
  invoice.client.name = clientName;
  return invoice;
}

function storedInvoices(): GstInvoice[] {
  return JSON.parse(window.localStorage.getItem(INVOICES_KEY) ?? "[]") as GstInvoice[];
}

describe("GstInvoiceGeneratorClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(cleanup);

  it("renders a tax invoice preview and counts on from the saved numbers", async () => {
    window.localStorage.setItem(INVOICES_KEY, JSON.stringify([savedInvoice("CC/26-27/007", "First client")]));
    render(<GstInvoiceGeneratorClient />);
    expect(screen.getAllByText("Tax Invoice").length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByDisplayValue("CC/26-27/008")).toBeInTheDocument());
  });

  it("keeps the plain invoice generator's storage separate", async () => {
    window.localStorage.setItem("cc-invoices", JSON.stringify([{ number: "INV0099" }]));
    render(<GstInvoiceGeneratorClient />);
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(storedInvoices()).toHaveLength(1));
    expect(JSON.parse(window.localStorage.getItem("cc-invoices")!)).toEqual([{ number: "INV0099" }]);
  });

  it("keeps an invoice saved in another tab", async () => {
    const first = savedInvoice("INV/26-27/0001", "First client");
    window.localStorage.setItem(INVOICES_KEY, JSON.stringify([first]));

    render(<GstInvoiceGeneratorClient />);

    const second = savedInvoice("INV/26-27/0002", "Second client");
    const oldValue = JSON.stringify([first]);
    const newValue = JSON.stringify([first, second]);

    act(() => {
      window.localStorage.setItem(INVOICES_KEY, newValue);
      window.dispatchEvent(new StorageEvent("storage", { key: INVOICES_KEY, oldValue, newValue }));
    });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      const names = storedInvoices().map((invoice) => invoice.client.name);
      expect(names).toContain("Second client");
      expect(names).toContain("First client");
    });
  });
});
