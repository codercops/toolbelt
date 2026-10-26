import { describe, it, expect } from "vitest";
import {
  decodeJwt,
  encodeJwt,
  verifyJwt,
  verifyWithJwks,
  computeHealth,
  describeAlg,
  isStandardClaim,
  securityAudit,
  stringifyJwtJson,
  uint8ToBase64Url,
  relativeTime,
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

describe("numbers too big for a JS number", () => {
  const part = (s: string) => uint8ToBase64Url(new TextEncoder().encode(s));
  const token = (payload: string, header = '{"alg":"HS256","typ":"JWT"}') => `${part(header)}.${part(payload)}.c2ln`;
  const decodeText = (payload: string, header?: string) => {
    const r = decodeJwt(token(payload, header));
    if (!r.ok) throw new Error(r.error);
    return stringifyJwtJson(r.value.payload, 2);
  };

  it("shows 12345678901234567890 exactly, not 12345678901234567000", () => {
    const text = decodeText('{"account_id":12345678901234567890}');
    expect(text).toContain("12345678901234567890");
    expect(text).not.toContain("12345678901234567000");
  });

  it("shows 9007199254740993 exactly, not 9007199254740992", () => {
    const text = decodeText('{"id":9007199254740993}');
    expect(text).toContain("9007199254740993");
    expect(text).not.toContain("9007199254740992");
  });

  it("keeps big numbers exact inside arrays and nested objects", () => {
    const text = decodeText('{"ids":[9007199254740993],"user":{"snowflake":1234567890123456789012}}');
    expect(text).toContain("9007199254740993");
    expect(text).toContain("1234567890123456789012");
  });

  it("keeps long decimals exact", () => {
    expect(decodeText('{"pi":3.14159265358979323846264338327950288}')).toContain("3.14159265358979323846264338327950288");
  });

  it("keeps a number too large for a JS number as written", () => {
    expect(decodeText('{"n":1e400}')).toContain("1e400");
  });

  it("keeps big numbers in the header exact too", () => {
    const r = decodeJwt(token("{}", '{"alg":"HS256","kid":9007199254740993}'));
    if (!r.ok) throw new Error(r.error);
    expect(stringifyJwtJson(r.value.header)).toContain("9007199254740993");
  });

  it("leaves ordinary numbers as plain JS numbers, so exp, nbf and iat still compare", () => {
    const r = decodeJwt(token('{"exp":1893456000,"nbf":1700000000,"iat":1700000000.5,"id":9007199254740993}'));
    if (!r.ok) throw new Error(r.error);
    expect(r.value.payload.exp).toBe(1893456000);
    expect(r.value.payload.nbf).toBe(1700000000);
    expect(r.value.payload.iat).toBe(1700000000.5);
    expect(typeof r.value.payload.id).not.toBe("number");
  });

  it("still works out expiry and health when another claim is a big number", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const r = decodeJwt(token(`{"exp":${exp},"iss":"me","aud":"you","id":12345678901234567890}`));
    if (!r.ok) throw new Error(r.error);
    expect(computeHealth(r.value).exp).toBe(exp);
    expect(securityAudit(r.value, false).some((f) => /exp/i.test(f.title))).toBe(false);
  });

  it("writes ordinary values the way JSON.stringify does", () => {
    const value = { a: 1, b: "x", c: [true, null, 1.5], d: { e: -2 } };
    expect(stringifyJwtJson(value)).toBe(JSON.stringify(value));
    expect(stringifyJwtJson(value, 2)).toBe(JSON.stringify(value, null, 2));
  });

  it("still decodes a payload that repeats a claim, as it did before (the last one wins)", () => {
    const r = decodeJwt(token('{"sub":"a","sub":"b","id":9007199254740993}'));
    if (!r.ok) throw new Error(r.error);
    expect(r.value.payload.sub).toBe("b");
  });

  it("still rejects text that is not JSON", () => {
    expect(decodeJwt(token("{12345678901234567890}")).ok).toBe(false);
    expect(decodeJwt(token("[12345678901234567890]")).ok).toBe(false);
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

describe("computeHealth with inherited property names", () => {
  const decoded = (header: Record<string, unknown>, payload: Record<string, unknown>): DecodedJwt => ({
    header,
    payload,
    signature: "sig",
    raw: { header: "", payload: "", signature: "sig" },
  });

  it("counts __proto__ as a custom claim", () => {
    // An object literal would not create an own "__proto__" key, so parse JSON.
    const payload = JSON.parse('{"sub":"1","__proto__":{"a":1}}') as Record<string, unknown>;
    const h = computeHealth(decoded({ alg: "HS256" }, payload));
    expect(h.standardCount).toBe(1);
    expect(h.customCount).toBe(1);
  });

  it("counts constructor as a custom claim", () => {
    const h = computeHealth(decoded({ alg: "HS256" }, { constructor: "x" }));
    expect(h.standardCount).toBe(0);
    expect(h.customCount).toBe(1);
  });

  it.each(["__proto__", "constructor", "toString"])("reports an unknown algorithm for alg %s", (alg) => {
    const h = computeHealth(decoded({ alg }, { sub: "1" }));
    expect(h.algDesc).toBe("Unknown algorithm");
  });
});

describe("isStandardClaim and describeAlg", () => {
  it("only match names the maps define themselves", () => {
    expect(isStandardClaim("sub")).toBe(true);
    expect(isStandardClaim("__proto__")).toBe(false);
    expect(isStandardClaim("constructor")).toBe(false);
    expect(describeAlg("HS256")).toBe("HMAC using SHA-256");
    expect(describeAlg("toString")).toBe("Unknown algorithm");
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

describe("relativeTime", () => {
  const nowMs = 1_000_000_000_000;
  const nowSec = nowMs / 1000;

  it("rolls up 59.6 seconds to 1 minute", () => {
    expect(relativeTime(nowSec - 59.6, nowMs)).toBe("1 minute ago");
    expect(relativeTime(nowSec + 59.6, nowMs)).toBe("in 1 minute");
  });

  it("rolls up 59.5 minutes to 1 hour", () => {
    expect(relativeTime(nowSec - 3570, nowMs)).toBe("1 hour ago");
    expect(relativeTime(nowSec + 3570, nowMs)).toBe("in 1 hour");
  });

  it("rolls up 23.6 hours to 1 day", () => {
    expect(relativeTime(nowSec - 23.6 * 3600, nowMs)).toBe("1 day ago");
    expect(relativeTime(nowSec + 23.6 * 3600, nowMs)).toBe("in 1 day");
  });

  it("rolls up 29.6 days to 1 month", () => {
    expect(relativeTime(nowSec - 29.6 * 86400, nowMs)).toBe("1 month ago");
    expect(relativeTime(nowSec + 29.6 * 86400, nowMs)).toBe("in 1 month");
  });

  it("rolls up 360 days to 1 year", () => {
    expect(relativeTime(nowSec - 360 * 86400, nowMs)).toBe("1 year ago");
    expect(relativeTime(nowSec + 360 * 86400, nowMs)).toBe("in 1 year");
  });
});
