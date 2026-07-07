# toolbelt

[![License: MIT](https://img.shields.io/badge/License-MIT-00E5C7.svg)](./LICENSE)
[![CI](https://github.com/codercops/toolbelt/actions/workflows/ci.yml/badge.svg)](https://github.com/codercops/toolbelt/actions/workflows/ci.yml)
[![Made by CODERCOPS](https://img.shields.io/badge/by-CODERCOPS-9E7BFF.svg)](https://www.codercops.com)

A developer's toolbelt: fast, privacy-first browser tools. Everything runs client-side, so there is no login, no upload, and no data leaves your tab. Live at **[tools.codercops.com](https://tools.codercops.com)**.

## Tools

- **JSON formatter and validator** — format, minify, validate, collapsible tree view, and JSON to CSV / TypeScript / YAML / XML / query string. Large numbers are preserved losslessly.
- **JWT decoder and inspector** — decode header, payload, and claims; verify HS/RS/PS/ES signatures via WebCrypto; security audit; HS256/384/512 encoder.
- **Base64 encoder and decoder** — text, images, and files; URL-safe variant; data URIs; magic-byte detection; Base32/58/85 and hashes.
- **Invoice generator** — live preview, vector PDF export with Unicode currency support, a reusable sender profile, all saved locally.

## Why it exists

CODERCOPS builds production backends and full-stack apps. These are the small utilities we reach for daily, rebuilt so they are genuinely private (nothing is sent anywhere) and pleasant to use. It is open source so you can read exactly what runs, self-host it, or borrow pieces.

## Stack

- Next.js 14 (App Router) and TypeScript
- Tailwind CSS with a small CSS-variable design system (light and dark themes)
- WebCrypto for JWT signing and verification
- jsPDF (dynamically imported) for invoice PDFs
- `lossless-json` so JSON number precision is never dropped
- Installable PWA via a web manifest, with a nonce-based Content-Security-Policy

## Run locally

```bash
nvm use            # Node 22 (see .nvmrc)
npm install
npm run dev        # http://localhost:3000
```

Scripts:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
npm run test       # vitest unit tests (lib/)
```

## Deploy your own

The app deploys to any Node host. On Vercel, import the repo and it builds with zero config. There are no required environment variables. If you fork it, update the domain in `lib/tools.ts` (`SITE_URL`) and `app/robots.ts` so the sitemap and canonical URLs point at your host.

## Add a tool

The tool set is a single typed registry in [`lib/tools.ts`](lib/tools.ts). The home grid, per-tool metadata, JSON-LD, hero, FAQ, CTA, sitemap, web manifest, and command palette all derive from it. To add a tool:

1. Add an entry to the `TOOLS` array in `lib/tools.ts`.
2. Create `app/(tools)/<slug>/page.tsx` (metadata plus your client component) and its `<Name>Client.tsx`.
3. Put pure logic in `lib/` and cover it with a test in `lib/__tests__/`.

## Project layout

```
app/                 shell (layout, error/not-found boundaries, metadata routes)
app/(tools)/         one route per tool, sharing a layout and ToolPageLayout
components/shared/   header, theme, toasts, command palette, reusable UI
lib/                 pure per-tool logic (parsing, crypto, PDF, conversions) — unit-tested
lib/tools.ts         the tool registry (single source of truth)
public/fonts/        subset Noto Sans used by the invoice PDF (OFL, see OFL.txt)
middleware.ts        per-request CSP nonce
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) and the [Code of Conduct](./CODE_OF_CONDUCT.md). In short: keep logic in `lib/`, add a test, and make sure `npm run lint && npm run test && npm run build` passes.

## Security

Found a vulnerability? Please report it privately per [SECURITY.md](./SECURITY.md) rather than opening a public issue.

## License

MIT, see [LICENSE](./LICENSE). The bundled Noto Sans font subsets are under the SIL Open Font License 1.1 ([public/fonts/OFL.txt](public/fonts/OFL.txt)).
