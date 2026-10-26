import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClaimValidators } from "./ClaimValidators";

const decoded = {
  header: {},
  payload: {},
  signature: "",
  raw: {
    header: "",
    payload: "",
    signature: "",
  },
};

describe("ClaimValidators accessible labels", () => {
  afterEach(cleanup);

  it("connects each visible label to its input", () => {
    render(<ClaimValidators decoded={decoded} />);

    expect(
      screen.getByLabelText("Expected iss")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Expected aud")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Clock leeway")
    ).toHaveAttribute("type", "number");
  });

  it("gives inputs unique ids across component instances", () => {
    render(
      <>
        <ClaimValidators decoded={decoded} />
        <ClaimValidators decoded={decoded} />
      </>
    );

    const inputs = [
      ...screen.getAllByLabelText("Expected iss"),
      ...screen.getAllByLabelText("Expected aud"),
      ...screen.getAllByLabelText("Clock leeway"),
    ];

    expect(inputs).toHaveLength(6);
    expect(inputs.every((input) => input.id !== "")).toBe(true);
    expect(new Set(inputs.map((input) => input.id)).size).toBe(6);
  });
});
describe("ClaimValidators deltas", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("carries a rounded delta into the next unit", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const now = new Date("2026-10-23T12:00:00Z");
    vi.setSystemTime(now);
    const nowSeconds = Math.floor(now.getTime() / 1000);
    const withClaims = {
      ...decoded,
      payload: {
        exp: nowSeconds + 3580, // 59.7 minutes: "in 1h", not "in 60m"
        nbf: nowSeconds + 86000, // 23.9 hours: "in 1d", not "in 24h"
        iat: nowSeconds - 3580, // "1h ago", not "60m ago"
      },
    };

    render(<ClaimValidators decoded={withClaims} />);

    expect(screen.getByText(/actual: \d+ \(in 1h\)/)).toBeInTheDocument();
    expect(screen.getByText(/actual: \d+ \(in 1d\)/)).toBeInTheDocument();
    expect(screen.getByText(/actual: \d+ \(1h ago\)/)).toBeInTheDocument();
  });
});
