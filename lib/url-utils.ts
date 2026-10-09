export type UrlEncodeMode = "component" | "uri";

export function encodeUrl(text: string, mode: UrlEncodeMode): string {
  return mode === "component" ? encodeURIComponent(text) : encodeURI(text);
}

export interface DecodeUrlOptions {
  plusAsSpace?: boolean;
}

export function decodeUrl(
  text: string,
  opts: DecodeUrlOptions = {}
): { ok: true; value: string } | { ok: false; error: string } {
  const input = opts.plusAsSpace ? text.replace(/\+/g, " ") : text;
  try {
    return { ok: true, value: decodeURIComponent(input) };
  } catch {
    return { ok: false, error: "Malformed percent-encoding — check for an incomplete %XX sequence" };
  }
}

export interface ParsedUrl {
  protocol: string;
  host: string;
  port: string;
  pathname: string;
  hash: string;
  params: [string, string][];
}

export function parseUrl(text: string): { ok: true; value: ParsedUrl } | { ok: false; error: string } {
  try {
    const url = new URL(text);
    return {
      ok: true,
      value: {
        protocol: url.protocol,
        host: url.host,
        port: url.port,
        pathname: url.pathname,
        hash: url.hash,
        params: [...url.searchParams],
      },
    };
  } catch {
    return { ok: false, error: "Not a valid absolute URL" };
  }
}
