import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ToastProvider } from "@/components/shared/Toast";
import { SAMPLE_JWT } from "@/lib/jwt-utils";
import { JwtDecoderClient } from "./JwtDecoderClient";

const source = readFileSync(join(process.cwd(), "app/(tools)/jwt-decoder/JwtDecoderClient.tsx"), "utf8");

describe("JWT decoder cURL disclosure", () => {
  it("exposes a stateful control connected to its panel", () => {
    expect(source).toContain('aria-expanded={curlOpen}');
    expect(source).toContain('aria-controls="jwt-curl-panel"');
    expect(source).toContain('id="jwt-curl-panel"');
    expect(source).toContain("setCurlOpen((v) => !v)");
  });
});

describe("JWT decoder copy button labels", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
  });

  it("names the cURL and signature copy buttons and keeps the visible Copy text", async () => {
    window.history.replaceState({}, "", `/?t=${SAMPLE_JWT}`);
    render(
      <ToastProvider>
        <JwtDecoderClient />
      </ToastProvider>,
    );

    expect(await screen.findByRole("button", { name: "Copy signature" })).toHaveTextContent("Copy");

    fireEvent.click(screen.getByRole("button", { name: "cURL" }));
    expect(await screen.findByRole("button", { name: "Copy cURL command" })).toHaveTextContent("Copy");
  });
});
