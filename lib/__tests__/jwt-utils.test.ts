import { describe, it, expect } from "vitest";
import {
  decodeJwt,
  encodeJwt,
  verifyJwt,
  verifyWithJwks,
  computeHealth,
  securityAudit,
  uint8ToBase64Url,
  SAMPLE_JWT,
  type DecodedJwt,
  type JwksKey,
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

  it("rejects a signature that isn't base64url", () => {
    const [h, p] = SAMPLE_JWT.split(".");
    const r = decodeJwt(`${h}.${p}.$(id)`);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("signature");
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

describe("verifyWithJwks", () => {
  async function rsaKey(kid: string) {
    const pair = (await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    )) as CryptoKeyPair;
    const pub = await crypto.subtle.exportKey("jwk", pair.publicKey);
    const priv = await crypto.subtle.exportKey("jwk", pair.privateKey);
    return { jwk: { ...pub, kid } as JwksKey, privateJwk: JSON.stringify(priv) };
  }

  it("verifies an RS256 token against the matching key", async () => {
    const a = await rsaKey("a");
    const token = await encodeJwt({ kid: "a" }, { sub: "1" }, a.privateJwk, "RS256");
    const r = await verifyWithJwks(token, [a.jwk]);
    expect(r.ok && r.valid).toBe(true);
  });

  it("refuses an HS256 token signed with the public JWK as the secret", async () => {
    const a = await rsaKey("a");
    const forged = await encodeJwt({ kid: "a" }, { sub: "admin" }, JSON.stringify(a.jwk), "HS256");
    const r = await verifyWithJwks(forged, [a.jwk]);
    expect(r.ok).toBe(false);
  });

  it("keeps trying keys when the token has no kid", async () => {
    const a = await rsaKey("a");
    const b = await rsaKey("b");
    const token = await encodeJwt({}, { sub: "1" }, b.privateJwk, "RS256");
    const r = await verifyWithJwks(token, [a.jwk, b.jwk]);
    expect(r.ok && r.valid).toBe(true);
  });

  it("reports invalid when no key matches the signature", async () => {
    const a = await rsaKey("a");
    const b = await rsaKey("b");
    const token = await encodeJwt({}, { sub: "1" }, b.privateJwk, "RS256");
    const r = await verifyWithJwks(token, [a.jwk]);
    expect(r.ok && !r.valid).toBe(true);
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
