import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { FileTab } from "./FileTab";

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

// Vitest globals are off, so Testing Library does not clean up on its own.
afterEach(cleanup);

function renderTab() {
  const utils = render(
    <ToastProvider>
      <FileTab />
    </ToastProvider>,
  );
  const single = utils.container.querySelector('input[type="file"]:not([multiple])') as HTMLInputElement;
  const multi = utils.container.querySelector('input[type="file"][multiple]') as HTMLInputElement;
  return { ...utils, single, multi };
}

function makeFile(bytes: number, name: string) {
  return new File([new Uint8Array(bytes)], name, { type: "application/octet-stream" });
}

const preview = (container: HTMLElement) => container.querySelector("pre") as HTMLPreElement;

describe("FileTab preview limit (#497)", () => {
  it("renders at most 64 KB of a large file's output and says how much is shown", async () => {
    const { container, single } = renderTab();
    fireEvent.change(single, { target: { files: [makeFile(200_000, "big.bin")] } });

    await waitFor(() => expect(screen.getByText(/Showing the first/)).toBeInTheDocument());

    // 200 000 bytes encode to ~266 668 base64 characters; the page must not get them all.
    expect(preview(container).textContent!.length).toBeLessThanOrEqual(65_536);
    expect(preview(container).textContent!.length).toBe(65_536);
    expect(screen.getByText(/65,536/)).toBeInTheDocument();
    expect(screen.getByText(/Copy and \.b64 keep the full output/)).toBeInTheDocument();
  });

  it("keeps the full output for Copy even though the preview is capped", async () => {
    const { single } = renderTab();
    fireEvent.change(single, { target: { files: [makeFile(200_000, "big.bin")] } });

    await waitFor(() => expect(screen.getByText(/Showing the first/)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/Copy big\.bin as Base64/));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied.length).toBeGreaterThan(65_536);
    expect(copied.replace(/\n/g, "")).toHaveLength(Math.ceil(200_000 / 3) * 4);
  });

  it("does not show the truncation line for a small file", async () => {
    const { container, single } = renderTab();
    fireEvent.change(single, { target: { files: [makeFile(9, "small.bin")] } });

    await waitFor(() => expect(preview(container).textContent).toBe("AAAAAAAAAAAA"));
    expect(screen.queryByText(/Showing the first/)).not.toBeInTheDocument();
  });
});

describe("FileTab batch preview", () => {
  it("only appends the ellipsis when the encoded value is longer than 160 characters", async () => {
    const { container, multi } = renderTab();
    fireEvent.change(multi, { target: { files: [makeFile(9, "small.bin"), makeFile(300, "large.bin")] } });

    await waitFor(() => expect(screen.getByText(/Batch · 2 files/)).toBeInTheDocument());
    const rows = Array.from(container.querySelectorAll("pre")).map((el) => el.textContent ?? "");
    const smallRow = rows.find((text) => text.startsWith("AAAAAAAAAAAA"))!;
    const largeRow = rows.find((text) => text.startsWith("AAAAAAAAAAAAAAAAAAAA"))!;

    expect(smallRow).toBe("AAAAAAAAAAAA");
    expect(smallRow.endsWith("...")).toBe(false);
    expect(largeRow.endsWith("...")).toBe(true);
    expect(largeRow.length).toBe(163);
  });
});
