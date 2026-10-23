const UUID_BYTES = 16;
const MAX_TIMESTAMP = 0xffffffffffff;
const UUID_PATTERN =
  /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export interface UuidFormatOptions {
  uppercase?: boolean;
  hyphens?: boolean;
}

export type UuidVariant = "ncs" | "rfc" | "microsoft" | "future";

export type UuidInspection =
  | {
      ok: true;
      version: number;
      variant: UuidVariant;
      timestampMs?: number;
      special?: "nil" | "max";
    }
  | { ok: false };

function validateRandom(random: Uint8Array): void {
  if (random.length !== UUID_BYTES) {
    throw new RangeError("UUID generation requires exactly 16 random bytes");
  }
}

export function uuidV4(random: Uint8Array): Uint8Array {
  validateRandom(random);
  const bytes = random.slice();
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytes;
}

export function uuidV7(nowMs: number, random: Uint8Array): Uint8Array {
  validateRandom(random);
  if (!Number.isSafeInteger(nowMs) || nowMs < 0 || nowMs > MAX_TIMESTAMP) {
    throw new RangeError("UUID v7 timestamp must be an integer from 0 to 2^48 - 1");
  }

  const bytes = random.slice();
  let timestamp = nowMs;
  for (let i = 5; i >= 0; i -= 1) {
    bytes[i] = timestamp % 256;
    timestamp = Math.floor(timestamp / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytes;
}

export function formatUuid(
  bytes: Uint8Array,
  { uppercase = false, hyphens = true }: UuidFormatOptions = {},
): string {
  if (bytes.length !== UUID_BYTES) {
    throw new RangeError("UUID formatting requires exactly 16 bytes");
  }

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const formatted = hyphens
    ? `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    : hex;
  return uppercase ? formatted.toUpperCase() : formatted;
}

export function inspectUuid(text: string): UuidInspection {
  const normalized = text.trim().replace(/-/g, "");
  if (!UUID_PATTERN.test(text.trim())) return { ok: false };

  const bytes = new Uint8Array(UUID_BYTES);
  for (let i = 0; i < UUID_BYTES; i += 1) {
    bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }

  const isNil = normalized === "0".repeat(32);
  const isMax = normalized.toLowerCase() === "f".repeat(32);
  const version = bytes[6] >> 4;
  const variantBits = bytes[8];
  const variant: UuidVariant =
    (variantBits & 0x80) === 0
      ? "ncs"
      : (variantBits & 0xc0) === 0x80
        ? "rfc"
        : (variantBits & 0xe0) === 0xc0
          ? "microsoft"
          : "future";

  const result: UuidInspection = {
    ok: true,
    version,
    variant,
    ...(isNil ? { special: "nil" as const } : {}),
    ...(isMax ? { special: "max" as const } : {}),
  };
  if (version === 7) {
    let timestampMs = 0;
    for (let i = 0; i < 6; i += 1) {
      timestampMs = timestampMs * 256 + bytes[i];
    }
    return { ...result, timestampMs };
  }
  return result;
}
