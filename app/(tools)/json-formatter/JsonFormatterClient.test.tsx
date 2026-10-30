import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { JsonFormatterClient } from "./JsonFormatterClient";

const mockWriteText = vi.fn().mockResolvedValue(undefined);

function renderClient() {
  return render(
    <ToastProvider>
      <JsonFormatterClient />
    </ToastProvider>,
  );
}

const inputEl = () => screen.getByLabelText("JSON input") as HTMLTextAreaElement;
const typeInput = (value: string) =>
  fireEvent.change(inputEl(), { target: { value } });
const clickFormat = () =>
  fireEvent.click(screen.getByRole("button", { name: "Format" }));
const toggleJson5 = () =>
  fireEvent.click(screen.getByRole("checkbox", { name: /json5/i }));

describe("JsonFormatterClient", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
    mockWriteText.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  describe("History – onSelect", () => {
    it("formats a strict-JSON history entry correctly in normal mode", async () => {
      renderClient();

      typeInput('{"b":2}');
      clickFormat();

      typeInput("{}");

      const entry = await screen.findByTitle(/\{"b":2\}/);
      fireEvent.click(entry);

      await waitFor(() => {
        expect(screen.queryByText("Invalid JSON")).not.toBeInTheDocument();
        expect(screen.getByText("Valid", { selector: ".badge-ok" })).toBeInTheDocument();
      });
    });

    it("formats a JSON5 history entry in JSON5 mode and does not leave stale output", async () => {
      renderClient();

      toggleJson5();
      typeInput("{a: 1,}");
      clickFormat();

      typeInput('{"b": 2}');
      clickFormat();

      await waitFor(() =>
        expect(screen.getByText("Valid", { selector: ".badge-ok" })).toBeInTheDocument(),
      );

      const entry = await screen.findByTitle(/\{a: 1,\}/);
      fireEvent.click(entry);

      await waitFor(() => {
        expect(inputEl().value).toBe("{a: 1,}");
        const outputEl = document.querySelector(".whitespace-pre");
        expect(outputEl).toHaveTextContent('"a": 1');
        expect(outputEl).not.toHaveTextContent('"b": 2');
        expect(screen.queryByText("Invalid JSON")).not.toBeInTheDocument();
        expect(screen.getByText("Valid", { selector: ".badge-ok" })).toBeInTheDocument();
      });
    });

    it("shows an error and clears stale output when a history entry fails strict parsing", async () => {
      renderClient();

      toggleJson5();
      typeInput("{a: 1,}");
      clickFormat();

      await waitFor(() =>
        expect(screen.getByText("Valid", { selector: ".badge-ok" })).toBeInTheDocument(),
      );

      toggleJson5();

      const entry = await screen.findByTitle(/\{a: 1,\}/);
      fireEvent.click(entry);

      await waitFor(() => {
        expect(screen.getByText("Invalid JSON")).toBeInTheDocument();
        expect(screen.queryByText("Valid", { selector: ".badge-ok" })).not.toBeInTheDocument();
      });
    });
  });

  describe("JSON5 mode", () => {
    it("minifies and sorts JSON5 input", async () => {
      renderClient();

      toggleJson5();
      typeInput("{b: 2, a: 1,}");
      fireEvent.click(screen.getByRole("button", { name: "Minify" }));

      await waitFor(() => expect(document.querySelector(".whitespace-pre")).toHaveTextContent('{"b":2,"a":1}'));
      expect(screen.queryByText("Invalid JSON")).not.toBeInTheDocument();

      typeInput("{b: 2, a: 1,}");
      fireEvent.click(screen.getByRole("button", { name: "Sort keys" }));

      await waitFor(() => expect(inputEl().value).toBe('{\n  "a": 1,\n  "b": 2\n}'));
      expect(screen.queryByText("Invalid JSON")).not.toBeInTheDocument();
    });
  });

  describe("Fetch from URL", () => {
    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("loads valid JSON from a URL, sets input and output, and closes the dialog", async () => {
      const payload = '{"hello":"world"}';
      vi.mocked(fetch).mockResolvedValue(
        new Response(payload, { status: 200 }),
      );

      renderClient();

      fireEvent.click(screen.getByRole("button", { name: /Fetch from URL/i }));

      const urlInput = await screen.findByLabelText("URL to fetch JSON from");
      fireEvent.change(urlInput, {
        target: { value: "https://example.com/data.json" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Fetch" }));

      await waitFor(() => {
        expect(
          screen.queryByLabelText("URL to fetch JSON from"),
        ).not.toBeInTheDocument();
        expect(inputEl().value).toBe(payload);
        expect(screen.getByText("Valid", { selector: ".badge-ok" })).toBeInTheDocument();
      });
    });

    it("shows an error alert and keeps dialog open when the response is not valid JSON", async () => {
      const payload = "not json at all";
      vi.mocked(fetch).mockResolvedValue(
        new Response(payload, { status: 200 }),
      );

      renderClient();

      fireEvent.click(screen.getByRole("button", { name: /Fetch from URL/i }));

      const urlInput = await screen.findByLabelText("URL to fetch JSON from");
      fireEvent.change(urlInput, {
        target: { value: "https://example.com/bad.json" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Fetch" }));

      await waitFor(() => {
        expect(
          screen.getByLabelText("URL to fetch JSON from"),
        ).toBeInTheDocument();
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("shows an error and clears output when fetch returns duplicate keys rejected by format", async () => {
      renderClient();
      typeInput('{"initial": 1}');
      clickFormat();
      await waitFor(() =>
        expect(screen.getByText("Valid", { selector: ".badge-ok" })).toBeInTheDocument(),
      );

      const dupPayload = '{"a": 1, "a": 2}';
      vi.mocked(fetch).mockResolvedValue(
        new Response(dupPayload, { status: 200 }),
      );

      fireEvent.click(screen.getByRole("button", { name: /Fetch from URL/i }));
      const urlInput = await screen.findByLabelText("URL to fetch JSON from");
      fireEvent.change(urlInput, {
        target: { value: "https://example.com/dup.json" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Fetch" }));

      await waitFor(() => {
        expect(inputEl().value).toBe(dupPayload);
        expect(screen.getByText("Invalid JSON")).toBeInTheDocument();
        expect(screen.queryByText("Valid", { selector: ".badge-ok" })).not.toBeInTheDocument();
      });
    });
  });

  describe("Pulse timer cleanup & duration", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("clears the pulse timer when unmounted right after a successful format", () => {
      const { unmount } = render(<JsonFormatterClient />);
      typeInput('{"key": "value"}');
      clickFormat();

      expect(vi.getTimerCount()).toBe(1);

      unmount();

      expect(vi.getTimerCount()).toBe(0);
    });

    it("shows the success pulse and removes it after 500 ms", () => {
      render(<JsonFormatterClient />);
      typeInput('{"key": "value"}');
      clickFormat();

      expect(document.querySelector(".animate-pulse-glow")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(document.querySelector(".animate-pulse-glow")).not.toBeInTheDocument();
    });

    it("leaves no timers behind when loading sample JSON", () => {
      render(<JsonFormatterClient />);
      fireEvent.click(screen.getByRole("button", { name: "Load example" }));
      expect(vi.getTimerCount()).toBe(0);
      expect(inputEl().value).toContain('"name": "Ada Lovelace"');
    });

    it("resets the pulse timer when formatted again before the previous timer expires", () => {
      render(<JsonFormatterClient />);
      typeInput('{"a": 1}');
      clickFormat();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      typeInput('{"a": 2}');
      clickFormat();

      expect(vi.getTimerCount()).toBe(1);

      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(document.querySelector(".animate-pulse-glow")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(document.querySelector(".animate-pulse-glow")).not.toBeInTheDocument();
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});

