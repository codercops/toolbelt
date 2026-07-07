# Contributing to toolbelt

Thanks for taking the time to help. This project is a small, careful collection of browser-based developer tools, and the bar is simple: everything runs client-side, nothing leaks, and the code stays readable.

## Getting set up

```bash
nvm use          # Node 22 (see .nvmrc)
npm install
npm run dev      # http://localhost:3000
```

Before opening a pull request, make sure this passes:

```bash
npm run lint && npm run test && npm run build
```

## How the code is organized

- Pure logic lives in `lib/` (parsing, crypto, PDF, conversions). It has no React and no DOM, so it is easy to test. Put new logic here, not inside components.
- Each tool is a route under `app/(tools)/<slug>/` with a small `page.tsx` and a `<Name>Client.tsx`.
- The tool set is a single registry in `lib/tools.ts`. The home grid, metadata, sitemap, manifest, and command palette all derive from it.
- Shared UI is in `components/shared/`.

## Guidelines

- Add or update a test in `lib/__tests__/` for any behavior change to `lib/`. The bugs this project has fixed were exactly the kind unit tests catch (number precision, money rounding, encoding edge cases).
- Keep the change focused. Small, single-purpose PRs are reviewed faster.
- Match the surrounding style. There is no separate formatter config; follow the existing code.
- No analytics, trackers, or network calls that send user data anywhere. The privacy claim is the whole point.
- If you add a tool, follow the "Add a tool" steps in the README.

## Adding a tool

1. Add a typed entry to the `TOOLS` array in `lib/tools.ts`.
2. Create `app/(tools)/<slug>/page.tsx` and its client component.
3. Add pure logic to `lib/` with tests.
4. That is it — the home page, sitemap, manifest, and palette pick it up automatically.

## Commits and pull requests

- Write clear commit messages in the imperative mood ("Add X", "Fix Y").
- Open a PR against `main`, describe what changed and why, and link any related issue.
- CI runs lint, tests, and the build on every PR. Green CI is required to merge.

## Reporting bugs and requesting features

Use the issue templates. For anything security-sensitive, follow [SECURITY.md](./SECURITY.md) instead of filing a public issue.
