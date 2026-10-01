import { describe, it, expect } from "vitest";
import {
  decodeJwt,
  encodeJwt,
  verifyJwt,
  computeHealth,
  securityAudit,
  uint8ToBase64Url,
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

  // RFC 7519: the JOSE header and the claims set are both JSON objects.
  // JSON.parse happily accepts null, arrays and primitives, so decodeJwt has
  // to reject those shapes itself — otherwise every downstream reader that does
  // `header.alg` / `payload.exp` throws a TypeError on the client.
  describe("non-object header or payload", () => {
    const part = (s: string) => uint8ToBase64Url(new TextEncoder().encode(s));
    const token = (header: string, payload: string) => `${part(header)}.${part(payload)}.c2ln`;

    it("rejects a null header", () => {
      const r = decodeJwt(token("null", '{"alg":"HS256"}'));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("Header is not a JSON object");
    });

    it("rejects an array header", () => {
      const r = decodeJwt(token("[]", '{"alg":"HS256"}'));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("Header is not a JSON object");
    });

    it("rejects a null payload", () => {
      const r = decodeJwt(token('{"alg":"HS256"}', "null"));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("Payload is not a JSON object");
    });

    it("rejects an array payload", () => {
      const r = decodeJwt(token('{"alg":"HS256"}', "[]"));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("Payload is not a JSON object");
    });

    it("rejects a primitive payload", () => {
      const r = decodeJwt(token('{"alg":"HS256"}', "123"));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("Payload is not a JSON object");
    });

    it("rejects the issue's bnVsbA.e30.x reproduction token", () => {
      expect(decodeJwt("bnVsbA.e30.x").ok).toBe(false);
    });

    it("still decodes the sample token", () => {
      expect(decodeJwt(SAMPLE_JWT).ok).toBe(true);
    });
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
