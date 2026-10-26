import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SENDER, emptyInvoice, type Invoice } from "@/lib/invoice-types";
import { InvoiceGeneratorClient } from "./InvoiceGeneratorClient";

const INVOICES_KEY = "cc-invoices";

function savedInvoice(number: string, clientName: string): Invoice {
  const invoice = emptyInvoice(DEFAULT_SENDER, number);
  invoice.billTo.name = clientName;
  return invoice;
}

function storedInvoices(): Invoice[] {
  return JSON.parse(window.localStorage.getItem(INVOICES_KEY) ?? "[]") as Invoice[];
}

describe("InvoiceGeneratorClient multi-tab saves", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(cleanup);

  it("keeps an invoice saved in another tab", async () => {
    const first = savedInvoice("INV0001", "First client");
    window.localStorage.setItem(INVOICES_KEY, JSON.stringify([first]));

    render(<InvoiceGeneratorClient />);

    const second = savedInvoice("INV0002", "Second client");
    const oldValue = JSON.stringify([first]);
    const newValue = JSON.stringify([first, second]);

    // Another tab writes its list; the browser delivers this event to the
    // remaining tabs. Setting storage here alone would not fire it.
    act(() => {
      window.localStorage.setItem(INVOICES_KEY, newValue);
      window.dispatchEvent(new StorageEvent("storage", { key: INVOICES_KEY, oldValue, newValue }));
    });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      const names = storedInvoices().map((invoice) => invoice.billTo.name);
      expect(names).toContain("Second client");
      expect(names).toContain("First client");
    });
  });
});
