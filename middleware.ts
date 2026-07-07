import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Content-Security-Policy with a per-request nonce. The nonce is placed on the
// request headers so Next can apply it to its own inline scripts, and on the
// response so the browser enforces it. In dev we relax to allow HMR (eval + ws).
export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const nonce = btoa(crypto.randomUUID());

  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const connectSrc = isDev ? "connect-src 'self' https: ws:" : "connect-src 'self' https:";

  const csp = [
    "default-src 'self'",
    scriptSrc,
    // Tailwind and inline style props need unsafe-inline; style injection risk is low.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    connectSrc,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  // Run on documents only; skip static assets and generated metadata routes.
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|icons/|fonts/|apple-icon|opengraph-image|manifest.webmanifest|sitemap.xml|robots.txt).*)",
    },
  ],
};
