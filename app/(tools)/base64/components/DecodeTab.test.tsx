import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { DecodeTab } from "./DecodeTab";

function decode(input: string) {
  render(
    <ToastProvider>
      <DecodeTab />
    </ToastProvider>,
  );
  fireEvent.change(screen.getByLabelText("Base64 to decode"), { target: { value: input } });
}

const notice = () => screen.queryByText(/Detected data URI/);
const infoValue = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

describe("DecodeTab data URIs", () => {
  // Vitest globals are off, so Testing Library does not clean up on its own.
  afterEach(cleanup);

  it.each([
    ["data:text/plain;base64,SGVsbG8gV29ybGQ=", "text/plain", "Hello World"],
    ["data:text/plain;charset=utf-8;base64,SGVsbG8gV29ybGQ=", "text/plain", "Hello World"],
    ["data:application/json;charset=UTF-8;base64,eyJhIjoxfQ==", "application/json", '{"a":1}'],
    ["data:text/plain;charset=utf-8;format=flowed;base64,SGVsbG8gV29ybGQ=", "text/plain", "Hello World"],
    ["DATA:text/plain;BASE64,SGVsbG8gV29ybGQ=", "text/plain", "Hello World"],
    ["data:;base64,SGVsbG8gV29ybGQ=", "text/plain", "Hello World"],
    ["  data:text/plain;charset=utf-8;base64,SGVsbG8gV29ybGQ=\n", "text/plain", "Hello World"],
  ])("decodes %j as %s", (uri, mime, text) => {
    decode(uri);
    expect(notice()).toBeInTheDocument();
    expect(screen.queryByText(/illegal character/)).not.toBeInTheDocument();
    expect(infoValue("MIME")).toBe(mime);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("shows the whole prefix it stripped, parameters included", () => {
    decode("data:text/plain;charset=utf-8;base64,SGVsbG8gV29ybGQ=");
    expect(screen.getByText("data:text/plain;charset=utf-8;base64,")).toBeInTheDocument();
  });

  it("does not treat a data URI without ;base64 as base64", () => {
    decode("data:text/plain,hello");
    expect(notice()).not.toBeInTheDocument();
  });

  it("exposes invalid base64 through an alert", async () => {
    decode("SGVs!bG8=");

    expect(await screen.findByRole("alert")).toHaveTextContent(/Invalid base64/i);
  });
});

describe("DecodeTab hex toggle", () => {
  afterEach(cleanup);

  it("reflects the hex dump state with aria-pressed", () => {
    render(
      <ToastProvider>
        <DecodeTab />
      </ToastProvider>,
    );
    fireEvent.change(screen.getByLabelText("Base64 to decode"), { target: { value: "SGVsbG8=" } });
    const hex = screen.getByRole("button", { name: "Hex" });
    expect(hex).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(hex);
    expect(hex).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Hex dump")).toBeInTheDocument();
    fireEvent.click(hex);
    expect(hex).toHaveAttribute("aria-pressed", "false");
  });
});
