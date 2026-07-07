export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  raw: { header: string; payload: string; signature: string };
}

export type DecodeResult =
  | { ok: true; value: DecodedJwt }
  | { ok: false; error: string; partial?: Partial<DecodedJwt> };

export function base64UrlToUint8(input: string): Uint8Array {
  const pad = input.length % 4 === 2 ? "==" : input.length % 4 === 3 ? "=" : "";
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function uint8ToBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecodeToString(input: string): string {
  const bytes = base64UrlToUint8(input);
  return new TextDecoder("utf-8").decode(bytes);
}

export function decodeJwt(token: string): DecodeResult {
  const trimmed = token.trim();
  if (!trimmed) return { ok: false, error: "Paste a JWT to decode it" };
  const parts = trimmed.split(".");
  if (parts.length !== 3) {
    return {
      ok: false,
      error: `Invalid JWT: expected 3 parts separated by dots, got ${parts.length} part${
        parts.length === 1 ? "" : "s"
      }`,
    };
  }
  const [h, p, s] = parts;
  let headerText: string | null = null;
  let payloadText: string | null = null;
  let header: Record<string, unknown> = {};
  let payload: Record<string, unknown> = {};
  try {
    headerText = base64UrlDecodeToString(h);
  } catch {
    return { ok: false, error: "Could not decode header — may be corrupted" };
  }
  try {
    payloadText = base64UrlDecodeToString(p);
  } catch {
    return { ok: false, error: "Could not decode payload — may be corrupted" };
  }
  try {
    header = JSON.parse(headerText);
  } catch {
    return {
      ok: false,
      error: "Decoded header successfully but result is not valid JSON",
    };
  }
  try {
    payload = JSON.parse(payloadText);
  } catch {
    return {
      ok: false,
      error: "Decoded payload successfully but result is not valid JSON",
    };
  }
  return {
    ok: true,
    value: {
      header,
      payload,
      signature: s,
      raw: { header: h, payload: p, signature: s },
    },
  };
}

export const ALG_DESCRIPTIONS: Record<string, string> = {
  HS256: "HMAC using SHA-256",
  HS384: "HMAC using SHA-384",
  HS512: "HMAC using SHA-512",
  RS256: "RSASSA-PKCS1-v1_5 using SHA-256",
  RS384: "RSASSA-PKCS1-v1_5 using SHA-384",
  RS512: "RSASSA-PKCS1-v1_5 using SHA-512",
  ES256: "ECDSA using P-256 and SHA-256",
  ES384: "ECDSA using P-384 and SHA-384",
  ES512: "ECDSA using P-521 and SHA-512",
  PS256: "RSASSA-PSS using SHA-256",
  PS384: "RSASSA-PSS using SHA-384",
  PS512: "RSASSA-PSS using SHA-512",
  none: "No signature — insecure",
};

export const STANDARD_CLAIMS: Record<string, string> = {
  iss: "Issuer",
  sub: "Subject",
  aud: "Audience",
  exp: "Expires at",
  nbf: "Not valid before",
  iat: "Issued at",
  jti: "JWT ID",
};

export function formatTimestamp(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  if (isNaN(d.getTime())) return "invalid date";
  return d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

export function relativeTime(unixSeconds: number, nowMs = Date.now()): string {
  const diff = unixSeconds * 1000 - nowMs;
  const abs = Math.abs(diff);
  const future = diff > 0;
  const units: [number, string][] = [
    [60 * 1000, "second"],
    [60 * 60 * 1000, "minute"],
    [24 * 60 * 60 * 1000, "hour"],
    [30 * 24 * 60 * 60 * 1000, "day"],
    [365 * 24 * 60 * 60 * 1000, "month"],
    [Infinity, "year"],
  ];
  let unit = "millisecond";
  let divisor = 1;
  for (let i = 0; i < units.length; i++) {
    if (abs < units[i][0]) {
      const prev = i === 0 ? 1000 : units[i - 1][0];
      unit = units[i][1];
      divisor = prev;
      break;
    }
  }
  const n = Math.round(abs / divisor);
  const label = n === 1 ? unit : `${unit}s`;
  return future ? `in ${n} ${label}` : `${n} ${label} ago`;
}

export function computeHealth(decoded: DecodedJwt, nowMs = Date.now()) {
  const header = decoded.header;
  const payload = decoded.payload;
  const alg = typeof header.alg === "string" ? header.alg : "unknown";
  const algDesc = ALG_DESCRIPTIONS[alg] ?? "Unknown algorithm";
  const exp = typeof payload.exp === "number" ? payload.exp : null;
  const iat = typeof payload.iat === "number" ? payload.iat : null;
  const nbf = typeof payload.nbf === "number" ? payload.nbf : null;

  let expiry: { status: "valid" | "expired" | "none" | "future"; label: string } = {
    status: "none",
    label: "No expiry claim",
  };
  if (exp !== null && exp * 1000 < nowMs) {
    // Expiry wins: an expired token is expired even if nbf is also in the future.
    expiry = { status: "expired", label: `Expired ${relativeTime(exp, nowMs)}` };
  } else if (nbf !== null && nbf * 1000 > nowMs) {
    expiry = { status: "future", label: `Not yet valid · activates ${relativeTime(nbf, nowMs)}` };
  } else if (exp !== null) {
    expiry = { status: "valid", label: `Valid · expires ${relativeTime(exp, nowMs)}` };
  }

  const standardKeys = Object.keys(payload).filter((k) => k in STANDARD_CLAIMS);
  const customKeys = Object.keys(payload).filter((k) => !(k in STANDARD_CLAIMS));

  return {
    alg,
    algDesc,
    expiry,
    exp,
    iat,
    nbf,
    standardCount: standardKeys.length,
    customCount: customKeys.length,
    totalClaims: Object.keys(payload).length,
  };
}

/* ---- Encoding (HS256/384/512) ---- */
const ALG_TO_HASH: Record<string, string> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
  RS256: "SHA-256",
  RS384: "SHA-384",
  RS512: "SHA-512",
  PS256: "SHA-256",
  PS384: "SHA-384",
  PS512: "SHA-512",
  ES256: "SHA-256",
  ES384: "SHA-384",
  ES512: "SHA-512",
};

const ES_CURVE: Record<string, string> = {
  ES256: "P-256",
  ES384: "P-384",
  ES512: "P-521",
};

/* ---- PEM parsing ---- */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(cleaned);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export type SupportedAlg =
  | "HS256" | "HS384" | "HS512"
  | "RS256" | "RS384" | "RS512"
  | "PS256" | "PS384" | "PS512"
  | "ES256" | "ES384" | "ES512";

function algParams(alg: SupportedAlg): AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams {
  if (alg.startsWith("HS")) return { name: "HMAC", hash: ALG_TO_HASH[alg] };
  if (alg.startsWith("RS")) return { name: "RSASSA-PKCS1-v1_5", hash: ALG_TO_HASH[alg] };
  if (alg.startsWith("PS")) return { name: "RSA-PSS", hash: ALG_TO_HASH[alg] };
  if (alg.startsWith("ES")) return { name: "ECDSA", namedCurve: ES_CURVE[alg] };
  throw new Error(`Unsupported algorithm: ${alg}`);
}

function algSignParams(alg: SupportedAlg): AlgorithmIdentifier | RsaPssParams | EcdsaParams {
  if (alg.startsWith("HS")) return { name: "HMAC" };
  if (alg.startsWith("RS")) return { name: "RSASSA-PKCS1-v1_5" };
  if (alg.startsWith("PS")) return { name: "RSA-PSS", saltLength: parseInt(alg.slice(2), 10) / 8 };
  if (alg.startsWith("ES")) return { name: "ECDSA", hash: ALG_TO_HASH[alg] };
  throw new Error(`Unsupported algorithm: ${alg}`);
}

export type VerifyResult =
  | { ok: true; valid: boolean; alg: SupportedAlg }
  | { ok: false; error: string };

async function importVerifyKey(
  alg: SupportedAlg,
  keyMaterial: string
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  if (alg.startsWith("HS")) {
    return crypto.subtle.importKey(
      "raw",
      enc.encode(keyMaterial),
      algParams(alg) as HmacImportParams,
      false,
      ["verify"]
    );
  }
  const trimmed = keyMaterial.trim();
  // JWK object path
  if (trimmed.startsWith("{")) {
    const jwk = JSON.parse(trimmed);
    return crypto.subtle.importKey("jwk", jwk, algParams(alg) as RsaHashedImportParams | EcKeyImportParams, false, ["verify"]);
  }
  // PEM — SPKI public key
  const buf = pemToArrayBuffer(trimmed);
  return crypto.subtle.importKey("spki", buf, algParams(alg) as RsaHashedImportParams | EcKeyImportParams, false, ["verify"]);
}

async function importSignKey(
  alg: SupportedAlg,
  keyMaterial: string
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  if (alg.startsWith("HS")) {
    return crypto.subtle.importKey(
      "raw",
      enc.encode(keyMaterial),
      algParams(alg) as HmacImportParams,
      false,
      ["sign"]
    );
  }
  const trimmed = keyMaterial.trim();
  if (trimmed.startsWith("{")) {
    const jwk = JSON.parse(trimmed);
    return crypto.subtle.importKey("jwk", jwk, algParams(alg) as RsaHashedImportParams | EcKeyImportParams, false, ["sign"]);
  }
  const buf = pemToArrayBuffer(trimmed);
  return crypto.subtle.importKey("pkcs8", buf, algParams(alg) as RsaHashedImportParams | EcKeyImportParams, false, ["sign"]);
}

/** Verify a JWT signature. `keyMaterial` is secret (HS) or PEM/JWK (RS/PS/ES). */
export async function verifyJwt(
  token: string,
  keyMaterial: string,
  algOverride?: SupportedAlg
): Promise<VerifyResult> {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return { ok: false, error: "Token does not have 3 parts" };
  let headerObj: Record<string, unknown>;
  try {
    headerObj = JSON.parse(new TextDecoder().decode(base64UrlToUint8(parts[0])));
  } catch {
    return { ok: false, error: "Could not parse header" };
  }
  const alg = (algOverride ?? (headerObj.alg as string)) as SupportedAlg;
  if (!alg || !(alg in ALG_TO_HASH)) {
    return { ok: false, error: `Unsupported or missing alg: ${String(alg)}` };
  }
  if (alg.startsWith("HS") && !keyMaterial) return { ok: false, error: "Secret required for HMAC" };
  try {
    const key = await importVerifyKey(alg, keyMaterial);
    const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlToUint8(parts[2]);
    const valid = await crypto.subtle.verify(
      algSignParams(alg),
      key,
      signature as BufferSource,
      signingInput as BufferSource
    );
    return { ok: true, valid, alg };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Verification failed" };
  }
}

export async function encodeJwt(
  headerObj: Record<string, unknown>,
  payloadObj: Record<string, unknown>,
  keyMaterial: string,
  alg: SupportedAlg
): Promise<string> {
  const finalHeader = { typ: "JWT", ...headerObj, alg };
  const enc = new TextEncoder();
  const headerPart = uint8ToBase64Url(enc.encode(JSON.stringify(finalHeader)));
  const payloadPart = uint8ToBase64Url(enc.encode(JSON.stringify(payloadObj)));
  const signingInput = `${headerPart}.${payloadPart}`;
  const key = await importSignKey(alg, keyMaterial);
  const sig = await crypto.subtle.sign(algSignParams(alg), key, enc.encode(signingInput));
  return `${signingInput}.${uint8ToBase64Url(new Uint8Array(sig))}`;
}

/* ---- JWKS ---- */
export interface JwksKey {
  kid?: string;
  kty: string;
  alg?: string;
  use?: string;
  n?: string;
  e?: string;
  x?: string;
  y?: string;
  crv?: string;
}

export interface JwksFetchResult {
  ok: boolean;
  keys: JwksKey[];
  error?: string;
}

export async function fetchJwks(url: string): Promise<JwksFetchResult> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, keys: [], error: `HTTP ${res.status}` };
    const data = await res.json();
    const keys = Array.isArray(data?.keys) ? (data.keys as JwksKey[]) : [];
    return { ok: true, keys };
  } catch (e) {
    return {
      ok: false,
      keys: [],
      error: e instanceof TypeError ? "CORS or network blocked the request" : (e instanceof Error ? e.message : "fetch failed"),
    };
  }
}

export async function verifyWithJwks(
  token: string,
  keys: JwksKey[]
): Promise<VerifyResult> {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, error: "Malformed token" };
  let header: Record<string, unknown>;
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlToUint8(parts[0])));
  } catch {
    return { ok: false, error: "Could not parse header" };
  }
  const alg = header.alg as SupportedAlg | undefined;
  const kid = header.kid as string | undefined;
  if (!alg) return { ok: false, error: "Header missing alg" };
  const candidates = keys.filter((k) => (kid ? k.kid === kid : true));
  if (candidates.length === 0) return { ok: false, error: kid ? `No JWK with kid="${kid}"` : "No keys in JWKS" };
  for (const jwk of candidates) {
    try {
      const r = await verifyJwt(token, JSON.stringify(jwk), alg);
      if (r.ok) return r;
    } catch {
      /* try next */
    }
  }
  return { ok: false, error: "None of the candidate keys verified" };
}

/* ---- Security audit ---- */
export type SeverityLevel = "critical" | "warning" | "info";

export interface SecurityFinding {
  level: SeverityLevel;
  title: string;
  detail: string;
}

export function securityAudit(decoded: DecodedJwt, hasSecret: boolean, secretLength = 0): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const alg = String(decoded.header.alg || "");
  const now = Date.now();

  if (alg.toLowerCase() === "none") {
    findings.push({
      level: "critical",
      title: "Algorithm is 'none'",
      detail: "A 'none' algorithm means there is no signature. Any attacker can forge tokens. Reject these tokens server-side.",
    });
  }
  if (alg.startsWith("HS") && hasSecret && secretLength < 32) {
    findings.push({
      level: "warning",
      title: "Secret is shorter than 32 bytes",
      detail: `HS${alg.slice(2)} ideally needs at least ${alg.slice(2)} bits of secret entropy (${parseInt(alg.slice(2), 10) / 8} bytes). Yours is ${secretLength}.`,
    });
  }
  if (typeof decoded.payload.exp !== "number") {
    findings.push({
      level: "warning",
      title: "No `exp` claim",
      detail: "Tokens without an expiration can be replayed indefinitely. Add an `exp` in the short-to-medium range.",
    });
  } else {
    const lifeMs = decoded.payload.exp * 1000 - now;
    const days = lifeMs / (1000 * 60 * 60 * 24);
    if (days > 30) {
      findings.push({
        level: "warning",
        title: "Very long-lived token",
        detail: `Token expires in ~${Math.round(days)} days. Consider refresh-token rotation instead of long access tokens.`,
      });
    }
    if (lifeMs < 0) {
      findings.push({ level: "critical", title: "Token already expired", detail: "Server should reject. Client should refresh." });
    }
  }
  if (decoded.payload.iat && typeof decoded.payload.iat === "number" && decoded.payload.iat * 1000 > now + 5 * 60 * 1000) {
    findings.push({ level: "warning", title: "`iat` is in the future", detail: "Issued-at timestamp is in the future. Clock skew, or token tampered?" });
  }
  if (!decoded.payload.iss) {
    findings.push({ level: "info", title: "No `iss` claim", detail: "Consider adding an issuer so relying parties can validate token origin." });
  }
  if (!decoded.payload.aud) {
    findings.push({ level: "info", title: "No `aud` claim", detail: "Without `aud`, this token could be replayed against any service that trusts the issuer." });
  }
  if (alg === "") {
    findings.push({ level: "critical", title: "Missing alg header", detail: "Header has no algorithm declaration." });
  }
  return findings;
}

export const SAMPLE_JWT =
  // header: {alg:"HS256",typ:"JWT"} / payload: realistic claims
  // signature is a sample (unsigned for demo; valid base64url)
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfNzM4OTIiLCJuYW1lIjoiQWRhIExvdmVsYWNlIiwiZW1haWwiOiJhZGFAY29kZXJjb3BzLmNvbSIsInJvbGVzIjpbImFkbWluIiwibWFpbnRhaW5lciJdLCJpc3MiOiJodHRwczovL2F1dGguY29kZXJjb3BzLmNvbSIsImF1ZCI6ImNvZGVyY29wcy10b29scyIsImlhdCI6MTc0NDcxNTIwMCwiZXhwIjo0MTAxOTAyNDAwfQ.8KYfaKvK2J0jR1tz2XeQyZ0rG5t8H9v5m3y8ZJqK1rE";
