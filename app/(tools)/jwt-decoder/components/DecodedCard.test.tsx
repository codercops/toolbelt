import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { decodeJwt, uint8ToBase64Url } from "@/lib/jwt-utils";
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

describe("DecodedCard with numbers too big for a JS number", () => {
  afterEach(cleanup);

  function renderToken(payload: string) {
    const part = (text: string) => uint8ToBase64Url(new TextEncoder().encode(text));
    const result = decodeJwt(`${part('{"alg":"none"}')}.${part(payload)}.`);
    if (!result.ok) throw new Error(result.error);
    return render(
      <ToastProvider>
        <DecodedCard title="Payload" data={result.value.payload} accent="#38bdf8" isPayload />
      </ToastProvider>,
    );
  }

  it("shows both numbers from the issue exactly", () => {
    const { container } = renderToken('{"account_id":12345678901234567890,"id":9007199254740993}');
    const code = container.querySelector("pre")?.textContent ?? "";
    expect(code).toContain('"account_id": 12345678901234567890');
    expect(code).toContain('"id": 9007199254740993');
  });

  it("shows the exact value in the humanized claims list as well", () => {
    renderToken('{"account_id":12345678901234567890}');
    const row = screen.getByText("account_id", { selector: "span" }).closest("dt")?.nextElementSibling;
    expect(row).toHaveTextContent("12345678901234567890");
    expect(row).not.toHaveTextContent("{");
  });

  it("still labels exp when another claim is big", () => {
    renderToken('{"exp":4102444800,"id":12345678901234567890}');
    expect(screen.getByText("Expires at")).toBeInTheDocument();
    expect(screen.getByText(/expires in/)).toBeInTheDocument();
  });
});
