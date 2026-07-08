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

## Branching and releases

toolbelt follows the standard CODERCOPS flow:

- `develop` is the default and integration branch; `production` is the deployed branch (tools.codercops.com). Never commit directly to either.
- Start every change on a branch off `develop`: `feat/*`, `fix/*`, `chore/*`, or `docs/*`.
- Open a PR into `develop` and **squash and merge** it (one squashed commit per feature). Use conventional commit titles (`feat:`, `fix:`, `chore:`, `docs:`). CI (lint, tests, build) must be green.
- A release is a PR from `develop` into `production`, merged as a **merge commit** (not squash), so production keeps full history. Bump the `package.json` version in that PR, and add a `release:minor` or `release:major` label if it is not a patch.
- Merging the release PR runs the Release workflow: it tags `vX.Y.Z`, publishes a GitHub Release, smoke-tests production, and fast-forwards `develop` back up to `production`.

Every push and PR to `develop` also deploys a preview (the develop branch has a staging domain); production deploys only from `production`.

## Reporting bugs and requesting features

Use the issue templates. For anything security-sensitive, follow [SECURITY.md](./SECURITY.md) instead of filing a public issue.
