import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { DecodedCard } from "./DecodedCard";

function renderPayload(json: string) {
  // An object literal would not create an own "__proto__" key, so parse JSON.
  const data = JSON.parse(json) as Record<string, unknown>;
  render(
    <ToastProvider>
      <DecodedCard title="Payload" data={data} accent="#38bdf8" isPayload />
    </ToastProvider>,
  );
}

describe("DecodedCard claims", () => {
  // Vitest globals are off, so Testing Library does not clean up on its own.
  afterEach(cleanup);

  it("renders a __proto__ claim as an ordinary custom claim", () => {
    renderPayload('{"__proto__":0}');
    // The claim name is listed, with its value and no standard-claim label.
    expect(screen.getAllByText("__proto__").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Issuer|Subject|Audience|Expires at|JWT ID/)).not.toBeInTheDocument();
  });

  it("renders a constructor claim without a label", () => {
    renderPayload('{"constructor":"x"}');
    expect(screen.getAllByText("constructor").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Issuer|Subject|Audience|Expires at|JWT ID/)).not.toBeInTheDocument();
  });

  it("still labels real standard claims", () => {
    renderPayload('{"sub":"1234"}');
    expect(screen.getByText("Subject")).toBeInTheDocument();
  });
});
