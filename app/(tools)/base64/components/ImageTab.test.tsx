import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { ImageTab } from "./ImageTab";

const writeText = vi.fn<(value: string) => Promise<void>>();

// happy-dom does not decode images, so the probe is replaced with a class that
// fires onload (with real dimensions) or onerror as soon as `src` is assigned.
function stubImage({ decodable, width = 0, height = 0 }: { decodable: boolean; width?: number; height?: number }) {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 0;
    naturalHeight = 0;

    set src(_value: string) {
      if (decodable) {
        this.naturalWidth = width;
        this.naturalHeight = height;
        this.onload?.();
      } else {
        this.onerror?.();
      }
    }
  }

  vi.stubGlobal("Image", FakeImage);
}

async function upload(name: string, type = "image/png") {
  const { container } = render(
    <ToastProvider>
      <ImageTab />
    </ToastProvider>,
  );
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, {
    target: { files: [new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], name, { type })] },
  });
  await screen.findByText(name);
  return container;
}

const shownSnippet = () => screen.getByText(/<img src=/).textContent ?? "";

async function copiedSnippet() {
  fireEvent.click(screen.getByRole("button", { name: "Copy HTML img tag" }));
  await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
  return writeText.mock.calls[0][0];
}

describe("ImageTab HTML snippet", () => {
  // Vitest globals are off, so Testing Library does not clean up on its own.
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });

  it("escapes quotes in the file name in the shown and copied snippet", async () => {
    stubImage({ decodable: true, width: 10, height: 20 });
    await upload('team "logo".png');

    const shown = shownSnippet();
    expect(shown).toContain('alt="team &quot;logo&quot;.png"');
    expect(shown).not.toContain('alt="team "logo".png"');
    expect(shown).toContain('width="10" height="20"');

    const copied = await copiedSnippet();
    expect(copied).toContain('alt="team &quot;logo&quot;.png"');
    expect(copied).toContain('width="10" height="20"');
    expect(copied).toMatch(/^<img src="data:image\/png;base64,/);
    expect(copied).toMatch(/\/>$/);
  });

  it("escapes ampersands and angle brackets in the file name", async () => {
    stubImage({ decodable: true, width: 4, height: 4 });
    await upload("a & b <c>.png");

    expect(shownSnippet()).toContain('alt="a &amp; b &lt;c>.png"');
    expect(await copiedSnippet()).toContain('alt="a &amp; b &lt;c>.png"');
  });

  it("leaves width and height out when the browser cannot decode the image", async () => {
    stubImage({ decodable: false });
    const container = await upload("broken.tiff", "image/tiff");

    const shown = shownSnippet();
    expect(shown).toContain('alt="broken.tiff"');
    expect(shown).not.toContain("width=");
    expect(shown).not.toContain("height=");

    const copied = await copiedSnippet();
    expect(copied).not.toContain("width=");
    expect(copied).not.toContain("height=");

    expect(screen.queryByText(/0×0/)).not.toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("says the size is unknown and explains the missing preview", async () => {
    stubImage({ decodable: false });
    await upload("broken.tiff", "image/tiff");

    expect(screen.getByText(/size unknown/)).toBeInTheDocument();
    expect(screen.getByText(/couldn't decode this image/)).toBeInTheDocument();
    expect(screen.getByText(/data URI itself is still valid/)).toBeInTheDocument();
  });

  it("keeps the real dimensions and the plain snippet shape for a normal image", async () => {
    stubImage({ decodable: true, width: 640, height: 480 });
    const container = await upload("logo.png");

    expect(container.querySelector("img")).not.toBeNull();
    const shown = shownSnippet();
    expect(shown).toBe(
      '<img src="data:image/png;base64,iVBORw==..." alt="logo.png" width="640" height="480" />',
    );
    expect(await copiedSnippet()).toBe(
      '<img src="data:image/png;base64,iVBORw==" alt="logo.png" width="640" height="480" />',
    );
  });
});
