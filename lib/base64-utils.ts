export interface EncodeOptions {
  urlSafe: boolean;
  padding: boolean;
}

export function encodeText(text: string, opts: EncodeOptions): string {
  const bytes = new TextEncoder().encode(text);
  return bytesToBase64(bytes, opts);
}

export function decodeText(s: string): { ok: true; value: string } | { ok: false; error: string } {
  const r = base64ToBytes(s);
  if (!r.ok) return r;
  try {
    return { ok: true, value: new TextDecoder("utf-8", { fatal: false }).decode(r.value) };
  } catch {
    return { ok: false, error: "Decoded successfully but result is not valid UTF-8 text" };
  }
}

export function bytesToBase64(bytes: Uint8Array, opts: EncodeOptions = { urlSafe: false, padding: true }): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    bin += String.fromCharCode.apply(null, Array.from(slice));
  }
  let b64 = btoa(bin);
  if (opts.urlSafe) b64 = b64.replace(/\+/g, "-").replace(/\//g, "_");
  if (!opts.padding) b64 = b64.replace(/=+$/, "");
  return b64;
}

export function base64ToBytes(
  s: string
): { ok: true; value: Uint8Array } | { ok: false; error: string } {
  const clean = s.trim().replace(/\s+/g, "");
  if (clean.length === 0) return { ok: true, value: new Uint8Array(0) };
  // URL-safe → standard
  let normalized = clean.replace(/-/g, "+").replace(/_/g, "/");
  // Pad
  while (normalized.length % 4 !== 0) normalized += "=";
  // Validate characters
  const invalidMatch = normalized.match(/[^A-Za-z0-9+/=]/);
  if (invalidMatch && invalidMatch.index !== undefined) {
    return {
      ok: false,
      error: `Invalid base64 string: illegal character "${invalidMatch[0]}" at position ${invalidMatch.index}`,
    };
  }
  try {
    const bin = atob(normalized);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { ok: true, value: bytes };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid base64 string" };
  }
}

export function detectBase64(s: string): boolean {
  const trimmed = s.trim();
  // Allow base64 and base64url, with or without padding, no internal whitespace
  if (trimmed.length < 8) return false;
  if (/\s/.test(trimmed)) return false;
  if (!/^[A-Za-z0-9+/=_-]+$/.test(trimmed)) return false;
  // A plain word ("password") is all letters and decodes cleanly, which caused
  // false positives. Real base64 of arbitrary bytes almost always contains a
  // digit, padding, or a base64-specific symbol — require at least one.
  if (!/[0-9+/=_-]/.test(trimmed)) return false;
  const normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");
  let padded = normalized;
  while (padded.length % 4 !== 0) padded += "=";
  try {
    atob(padded);
    return true;
  } catch {
    return false;
  }
}

export function splitLines(s: string, n = 76): string {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n));
  return out.join("\n");
}

export function toDataUri(bytes: Uint8Array, mime: string): string {
  return `data:${mime};base64,${bytesToBase64(bytes, { urlSafe: false, padding: true })}`;
}

export interface MagicMatch {
  mime: string;
  extension: string;
  label: string;
  isImage: boolean;
}

export function getMimeFromMagicBytes(bytes: Uint8Array): MagicMatch | null {
  if (bytes.length < 4) return null;
  const b = bytes;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
    return { mime: "image/png", extension: "png", label: "PNG image", isImage: true };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return { mime: "image/jpeg", extension: "jpg", label: "JPEG image", isImage: true };
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38)
    return { mime: "image/gif", extension: "gif", label: "GIF image", isImage: true };
  if (b[0] === 0x42 && b[1] === 0x4d)
    return { mime: "image/bmp", extension: "bmp", label: "BMP image", isImage: true };
  if (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00)
    return { mime: "image/x-icon", extension: "ico", label: "ICO image", isImage: true };
  if (b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00)
    return { mime: "image/tiff", extension: "tiff", label: "TIFF image (little-endian)", isImage: true };
  if (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00 && b[3] === 0x2a)
    return { mime: "image/tiff", extension: "tiff", label: "TIFF image (big-endian)", isImage: true };
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return { mime: "image/webp", extension: "webp", label: "WebP image", isImage: true };
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x41 && b[10] === 0x56 && b[11] === 0x45)
    return { mime: "audio/wav", extension: "wav", label: "WAV audio", isImage: false };
  if (b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (brand.startsWith("heic") || brand.startsWith("heix") || brand.startsWith("hevc"))
      return { mime: "image/heic", extension: "heic", label: "HEIC image", isImage: true };
    return { mime: "video/mp4", extension: "mp4", label: "MP4 video", isImage: false };
  }
  if (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33)
    return { mime: "audio/mpeg", extension: "mp3", label: "MP3 audio", isImage: false };
  if (b[0] === 0xff && (b[1] === 0xfb || b[1] === 0xf3 || b[1] === 0xf2))
    return { mime: "audio/mpeg", extension: "mp3", label: "MP3 audio", isImage: false };
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46)
    return { mime: "application/pdf", extension: "pdf", label: "PDF document", isImage: false };
  if (b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) {
    const tail = new TextDecoder().decode(b.subarray(0, Math.min(b.length, 2048)));
    if (tail.includes("word/")) return { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: "docx", label: "DOCX document", isImage: false };
    if (tail.includes("xl/")) return { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx", label: "XLSX spreadsheet", isImage: false };
    if (tail.includes("ppt/")) return { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", extension: "pptx", label: "PPTX presentation", isImage: false };
    return { mime: "application/zip", extension: "zip", label: "ZIP archive", isImage: false };
  }
  if (b[0] === 0x1f && b[1] === 0x8b)
    return { mime: "application/gzip", extension: "gz", label: "Gzip archive", isImage: false };
  if (b.length >= 5 && b[0] === 0x3c && b[1] === 0x3f && b[2] === 0x78 && b[3] === 0x6d && b[4] === 0x6c)
    return { mime: "application/xml", extension: "xml", label: "XML document", isImage: false };
  if (b.length >= 5 && b[0] === 0x3c && (b[1] === 0x21 || b[1] === 0x68 || b[1] === 0x48))
    return { mime: "text/html", extension: "html", label: "HTML document", isImage: false };
  if (b[0] === 0x7b || b[0] === 0x5b) {
    try {
      JSON.parse(new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.length, 4096))));
      return { mime: "application/json", extension: "json", label: "JSON document", isImage: false };
    } catch {
      /* not valid JSON */
    }
  }
  if (b.length >= 5 && b[0] === 0x3c && b[1] === 0x73 && b[2] === 0x76 && b[3] === 0x67)
    return { mime: "image/svg+xml", extension: "svg", label: "SVG image", isImage: true };
  // Heuristic for plain UTF-8 text
  let textScore = 0;
  for (let i = 0; i < Math.min(200, b.length); i++) {
    const c = b[i];
    if ((c >= 0x20 && c <= 0x7e) || c === 0x09 || c === 0x0a || c === 0x0d) textScore++;
  }
  if (textScore / Math.min(200, b.length) > 0.95) {
    return { mime: "text/plain", extension: "txt", label: "Plain text (UTF-8)", isImage: false };
  }
  return null;
}

/* ---- Language-literal copy ---- */
export type LangTarget =
  | "javascript"
  | "typescript"
  | "python"
  | "go"
  | "rust"
  | "java"
  | "shell"
  | "sql";

export function toLanguageLiteral(value: string, lang: LangTarget): string {
  switch (lang) {
    case "javascript":
    case "typescript":
      return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    case "python":
      return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    case "go":
      return '"' + value.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
    case "rust":
      return '"' + value.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
    case "java":
      return '"' + value.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
    case "shell":
      return "'" + value.replace(/'/g, "'\\''") + "'";
    case "sql":
      return "'" + value.replace(/'/g, "''") + "'";
  }
}

/* ---- Hashes ---- */
export async function computeHashes(bytes: Uint8Array): Promise<Record<string, string>> {
  const entries = await Promise.all(
    (["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const).map(async (alg) => {
      const buf = await crypto.subtle.digest(alg, bytes as BufferSource);
      return [alg.toLowerCase().replace("-", ""), bytesToHex(new Uint8Array(buf))] as const;
    })
  );
  return {
    md5: md5Hex(bytes),
    ...Object.fromEntries(entries),
  };
}

export function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  return s;
}

/* ---- MD5 (RFC 1321, tiny implementation) ---- */
function md5Hex(bytes: Uint8Array): string {
  const msg = new Uint8Array(bytes);
  const msgLen = msg.length;
  const bitLen = msgLen * 8;
  const padded = new Uint8Array((((msgLen + 9 + 63) >> 6) << 6));
  padded.set(msg);
  padded[msgLen] = 0x80;
  // Append length as 64-bit little-endian
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, bitLen >>> 0, true);
  dv.setUint32(padded.length - 4, Math.floor(bitLen / 0x100000000) >>> 0, true);

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);

  const rol = (x: number, n: number) => ((x << n) | (x >>> (32 - n))) >>> 0;

  for (let chunkStart = 0; chunkStart < padded.length; chunkStart += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      M[j] = dv.getUint32(chunkStart + j * 4, true);
    }
    let A = a;
    let B = b;
    let C = c;
    let D = d;
    for (let i = 0; i < 64; i++) {
      let F = 0;
      let g = 0;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + rol(F, S[i])) >>> 0;
    }
    a = (a + A) >>> 0;
    b = (b + B) >>> 0;
    c = (c + C) >>> 0;
    d = (d + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, a, true);
  odv.setUint32(4, b, true);
  odv.setUint32(8, c, true);
  odv.setUint32(12, d, true);
  return bytesToHex(out);
}

/* ---- Gzip helpers ---- */
export async function gzipBytes(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === "undefined") return null;
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream("gzip"));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

export async function gunzipBytes(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === "undefined") return null;
  try {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

/* ---- Base32 (RFC 4648) ---- */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function bytesToBase32(bytes: Uint8Array, padding = true): string {
  let out = "";
  let bits = 0;
  let value = 0;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 0x1f];
  if (padding) {
    while (out.length % 8 !== 0) out += "=";
  }
  return out;
}

/* ---- Base58 (Bitcoin alphabet) ---- */
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function bytesToBase58(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  // Count leading zero bytes
  let zeroes = 0;
  while (zeroes < bytes.length && bytes[zeroes] === 0) zeroes++;
  // Work with a big-number representation in base-256
  const b256 = Array.from(bytes);
  const digits: number[] = [];
  let start = zeroes;
  while (start < b256.length) {
    let carry = 0;
    for (let i = start; i < b256.length; i++) {
      const acc = (carry << 8) + b256[i];
      b256[i] = Math.floor(acc / 58);
      carry = acc % 58;
    }
    digits.push(carry);
    while (start < b256.length && b256[start] === 0) start++;
  }
  return "1".repeat(zeroes) + digits.reverse().map((d) => B58[d]).join("");
}

/* ---- Ascii85 (Adobe) ---- */
export function bytesToAscii85(bytes: Uint8Array): string {
  let out = "<~";
  let i = 0;
  while (i + 4 <= bytes.length) {
    const n =
      bytes[i] * 0x1000000 + bytes[i + 1] * 0x10000 + bytes[i + 2] * 0x100 + bytes[i + 3];
    if (n === 0) out += "z";
    else {
      const c4 = n % 85;
      const c3 = Math.floor(n / 85) % 85;
      const c2 = Math.floor(n / (85 * 85)) % 85;
      const c1 = Math.floor(n / (85 * 85 * 85)) % 85;
      const c0 = Math.floor(n / (85 * 85 * 85 * 85)) % 85;
      out += String.fromCharCode(c0 + 33, c1 + 33, c2 + 33, c3 + 33, c4 + 33);
    }
    i += 4;
  }
  if (i < bytes.length) {
    const remaining = bytes.length - i;
    let n = 0;
    for (let j = 0; j < 4; j++) {
      n = n * 256 + (i + j < bytes.length ? bytes[i + j] : 0);
    }
    const chars: string[] = [];
    for (let j = 0; j < 5; j++) {
      chars.unshift(String.fromCharCode((n % 85) + 33));
      n = Math.floor(n / 85);
    }
    out += chars.slice(0, remaining + 1).join("");
  }
  return out + "~>";
}

/* ---- Hex (convenience) ---- */
export function bytesToHexSpaced(bytes: Uint8Array): string {
  return bytesToHex(bytes).replace(/(.{2})/g, "$1 ").trim();
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
