import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { CronExplainerClient } from "./CronExplainerClient";

const mockWriteText = vi.fn().mockResolvedValue(undefined);

function renderClient() {
  return render(
    <ToastProvider>
      <CronExplainerClient />
    </ToastProvider>,
  );
}

const input = () => screen.getByLabelText("Cron expression") as HTMLInputElement;
const type = (value: string) => fireEvent.change(input(), { target: { value } });
const runsList = () => screen.findByRole("list", { name: "Next runs" });

describe("CronExplainerClient", () => {
  beforeEach(() => {
    // Only the clock is faked, so the next runs are the same every time.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-23T10:07:30Z"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
    mockWriteText.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("explains a weekday schedule and lists the next five runs when it opens", async () => {
    renderClient();
    expect(input().value).toBe("0 9 * * 1-5");
    expect(screen.getByText("At 09:00 on weekdays")).toBeInTheDocument();
    const runs = within(await runsList()).getAllByRole("listitem");
    expect(runs).toHaveLength(5);
    // 2026-10-23 is a Friday and 10:07 is past 09:00, so the next run is Monday
    expect(runs[0]).toHaveTextContent("26 Oct 2026, 09:00 UTC");
    expect(runs[4]).toHaveTextContent("30 Oct 2026, 09:00 UTC");
  });

  it("updates the description and the runs as you type", async () => {
    renderClient();
    type("*/15 * * * *");
    // The same words are on an example button, so look at the description paragraph
    expect(screen.getByText("Every 15 minutes", { selector: "p" })).toBeInTheDocument();
    const runs = within(await runsList()).getAllByRole("listitem");
    expect(runs[0]).toHaveTextContent("23 Oct 2026, 10:15 UTC");
    expect(runs[1]).toHaveTextContent("23 Oct 2026, 10:30 UTC");
  });

  it("shows a table that explains each field", () => {
    renderClient();
    type("*/15 9-17 1,15 JAN-MAR MON-FRI");
    const table = screen.getByRole("table", { name: /what each field/i });
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(6);
    expect(within(table).getByRole("rowheader", { name: "Minute" }).closest("tr")).toHaveTextContent(
      "every 15 minutes (0, 15, 30, 45)",
    );
    expect(within(table).getByRole("rowheader", { name: "Month" }).closest("tr")).toHaveTextContent(
      "January through March",
    );
    expect(within(table).getByRole("rowheader", { name: "Day of week" }).closest("tr")).toHaveTextContent(
      "Monday through Friday",
    );
  });

  describe("errors", () => {
    it("names the minute field for 60 * * * * and hides the results", () => {
      renderClient();
      type("60 * * * *");
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/minute/i);
      expect(alert).toHaveTextContent("60");
      expect(input()).toHaveAttribute("aria-invalid", "true");
      expect(screen.queryByText("In plain English")).not.toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("clears the error once the expression is fixed", async () => {
      renderClient();
      type("60 * * * *");
      expect(screen.getByRole("alert")).toBeInTheDocument();
      type("0 * * * *");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(input()).toHaveAttribute("aria-invalid", "false");
      expect(screen.getByText("Every hour, on the hour")).toBeInTheDocument();
      await runsList();
    });

    it("says how many fields it found", () => {
      renderClient();
      type("* * * *");
      expect(screen.getByRole("alert")).toHaveTextContent(/found 4/);
    });

    it("shows no error and no results for an empty box", () => {
      renderClient();
      type("   ");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByText("In plain English")).not.toBeInTheDocument();
    });
  });

  describe("examples", () => {
    it("fills in the expression when one is chosen", async () => {
      renderClient();
      fireEvent.click(screen.getByRole("button", { name: "Every Monday" }));
      expect(input().value).toBe("0 9 * * 1");
      expect(screen.getByText("At 09:00 on Monday")).toBeInTheDocument();
      await runsList();
    });

    it("marks the chosen example as pressed", () => {
      renderClient();
      const weekdays = screen.getByRole("button", { name: "Weekdays at 09:00" });
      const monday = screen.getByRole("button", { name: "Every Monday" });
      expect(weekdays).toHaveAttribute("aria-pressed", "true");
      expect(monday).toHaveAttribute("aria-pressed", "false");
      fireEvent.click(monday);
      expect(weekdays).toHaveAttribute("aria-pressed", "false");
      expect(monday).toHaveAttribute("aria-pressed", "true");
    });

    it("has an example for every kind of schedule and each one is valid", () => {
      renderClient();
      const group = screen.getByRole("group", { name: "Examples" });
      const buttons = within(group).getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(6);
      for (const button of buttons) {
        fireEvent.click(button);
        expect(screen.queryByRole("alert"), button.textContent ?? "").not.toBeInTheDocument();
      }
    });
  });

  describe("time zone", () => {
    it("starts on UTC and switches to local time", async () => {
      renderClient();
      const utc = screen.getByRole("button", { name: "UTC" });
      const local = screen.getByRole("button", { name: "Local" });
      expect(utc).toHaveAttribute("aria-pressed", "true");
      expect(local).toHaveAttribute("aria-pressed", "false");
      fireEvent.click(local);
      expect(utc).toHaveAttribute("aria-pressed", "false");
      expect(local).toHaveAttribute("aria-pressed", "true");
      expect(within(await runsList()).getAllByRole("listitem")).toHaveLength(5);
    });

    it("labels the group for assistive technology", () => {
      renderClient();
      expect(screen.getByRole("group", { name: "Time zone" })).toBeInTheDocument();
    });
  });

  describe("a schedule that never runs", () => {
    it("says so instead of listing runs", async () => {
      renderClient();
      type("0 0 31 2 *");
      expect(screen.getByText("At 00:00 on day 31 of the month in February")).toBeInTheDocument();
      const message = await screen.findByText(/never runs/);
      expect(message).toHaveTextContent(/February/);
      expect(message).toHaveTextContent(/day 31/);
      expect(screen.queryByRole("list", { name: "Next runs" })).not.toBeInTheDocument();
    });
  });

  describe("notes", () => {
    it("explains a macro", () => {
      renderClient();
      type("@daily");
      expect(screen.getByText("At 00:00 every day")).toBeInTheDocument();
      expect(screen.getByText(/is the same as/)).toHaveTextContent("@daily is the same as 0 0 * * *.");
    });

    it("explains that either day can match, only when both are set", () => {
      renderClient();
      expect(screen.queryByText(/match\s+either one/)).not.toBeInTheDocument();
      type("0 0 1 * 1");
      expect(screen.getByText(/match\s+either one/)).toBeInTheDocument();
      type("0 0 1 * *");
      expect(screen.queryByText(/match\s+either one/)).not.toBeInTheDocument();
    });
  });

  describe("copying", () => {
    it("copies the description", async () => {
      renderClient();
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
      await waitFor(() => expect(mockWriteText).toHaveBeenCalledWith("At 09:00 on weekdays"));
    });
  });
});
