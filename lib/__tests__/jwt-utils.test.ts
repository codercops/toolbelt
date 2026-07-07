import { describe, it, expect } from "vitest";
import {
  decodeJwt,
  encodeJwt,
  verifyJwt,
  computeHealth,
  securityAudit,
  SAMPLE_JWT,
  type DecodedJwt,
} from "../jwt-utils";

describe("decodeJwt", () => {
  it("decodes the sample token into header and payload", () => {
    const r = decodeJwt(SAMPLE_JWT);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.header.alg).toBe("HS256");
      expect(r.value.payload.name).toBe("Ada Lovelace");
    }
  });

  it("rejects a token without three parts", () => {
    const r = decodeJwt("abc.def");
    expect(r.ok).toBe(false);
  });
});

describe("HS256 sign and verify round-trip", () => {
  it("verifies a token it just signed", async () => {
    const token = await encodeJwt({}, { sub: "123" }, "topsecret", "HS256");
    const good = await verifyJwt(token, "topsecret");
    expect(good.ok && good.valid).toBe(true);
    const bad = await verifyJwt(token, "wrong");
    expect(bad.ok && bad.valid).toBe(false);
  });
});

describe("computeHealth expiry ordering", () => {
  const now = 1_000_000_000_000;
  const decoded = (payload: Record<string, unknown>): DecodedJwt => ({
    header: { alg: "HS256" },
    payload,
    signature: "sig",
    raw: { header: "", payload: "", signature: "sig" },
  });

  it("reports expired even when nbf is in the future", () => {
    const h = computeHealth(decoded({ exp: now / 1000 - 100, nbf: now / 1000 + 100 }), now);
    expect(h.expiry.status).toBe("expired");
  });

  it("reports future when not expired but nbf is ahead", () => {
    const h = computeHealth(decoded({ exp: now / 1000 + 1000, nbf: now / 1000 + 100 }), now);
    expect(h.expiry.status).toBe("future");
  });
});

describe("securityAudit", () => {
  it("flags alg none as critical", () => {
    const findings = securityAudit(
      { header: { alg: "none" }, payload: {}, signature: "", raw: { header: "", payload: "", signature: "" } },
      false
    );
    expect(findings.some((f) => f.level === "critical")).toBe(true);
  });
});
