# Contributing to toolbelt

Thanks for taking the time to help. This project is a small, careful collection of browser-based developer tools, and the bar is simple: everything runs client-side, nothing leaks, and the code stays readable.

## Hacktoberfest 2026

We're taking part in Hacktoberfest this year, and first-time contributors are very welcome.

1. Pick an open issue labeled [`hacktoberfest`](https://github.com/codercops/toolbelt/issues?q=is%3Aissue+is%3Aopen+label%3Ahacktoberfest+no%3Aassignee) or [`good first issue`](https://github.com/codercops/toolbelt/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22+no%3Aassignee) that nobody is assigned to. Want to build a whole new tool? Look at the [`new tool`](https://github.com/codercops/toolbelt/issues?q=is%3Aissue+is%3Aopen+label%3A%22new+tool%22) issues.
2. Comment on it to ask for it. I'll assign it to you, usually within a day. Please don't start on an issue that's assigned to someone else.
3. Take one issue at a time. Once your PR is merged, grab the next one.
4. If you're assigned and there's no PR or update for 5 days, I'll free the issue up for someone else. Just comment if you need more time.
5. Open your PR against `develop` and put `Closes #<issue number>` in the description.

PRs count for Hacktoberfest once they're merged or labeled `hacktoberfest-accepted`. PRs that aren't linked to an issue, only reformat code, or change things nobody asked for will be closed, and spammy ones get the `spam` label. If you have an idea that isn't an issue yet, open an issue first so we can agree on it before you write code.

Stuck? Ask on the issue. Questions are welcome.

## Getting set up

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/toolbelt.git
cd toolbelt
git remote add upstream https://github.com/codercops/toolbelt.git
git checkout -b feat/my-change upstream/develop

nvm use          # Node 22 (see .nvmrc)
npm install
npm run dev      # http://localhost:3000
```

`npm run dev` and `npm run build` first generate `generated/og-fonts.ts` (it's gitignored). On a fresh clone, type-checking fails until one of them has run once.

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

1. Add a typed entry at the end of the `TOOLS` array in `lib/tools.ts`, filling every field of the `Tool` interface.
   - Pick `accentVar` from the theme variables in `app/globals.css` (`--cyan`, `--amber`, `--rose`, `--violet`, `--sky`, `--lime`) and set `accentHex` to that variable's dark-theme value.
   - `heroDim` must be `""` or part of `heroHeading`.
   - Write 3 or 4 FAQs. Keep `metaTitle` under 60 characters and `metaDescription` around 150 to 160.
   - Keep `features` and `ogDescription` to plain Latin text; the social card font has no arrows or symbols.
2. Create `app/(tools)/<slug>/page.tsx`, a `<Name>Client.tsx` client component, and `opengraph-image.tsx`. Copying `page.tsx` and `opengraph-image.tsx` from `app/(tools)/base64/` and changing the slug is the easiest start.
3. Put pure logic in `lib/<name>.ts` with tests in `lib/__tests__/<name>.test.ts`. Use relative imports in tests; vitest has no `@/` alias.
4. Add the tool to the "Which tool?" dropdown in `.github/ISSUE_TEMPLATE/bug_report.yml`.

The home page, metadata, JSON-LD, sitemap, manifest and command palette pick the new tool up from the registry automatically. Several people may be adding tools at the same time, so rebase on `develop` before asking for review.

## Branching and releases

toolbelt follows the standard CODERCOPS flow:

- `develop` is the default and integration branch; `production` is the deployed branch (tools.codercops.com). Never commit directly to either.
- Start every change on a branch off `develop`: `feat/*`, `fix/*`, `chore/*`, or `docs/*`.
- Open a PR into `develop` and **squash and merge** it (one squashed commit per feature). Use conventional commit titles (`feat:`, `fix:`, `chore:`, `docs:`). CI (lint, tests, build) must be green.
- A release is a PR from `develop` into `production`, merged as a **merge commit** (not squash), so production keeps full history. Bump the `package.json` version in that PR, and add a `release:minor` or `release:major` label if it is not a patch.
- Merging the release PR runs the Release workflow: it tags `vX.Y.Z`, publishes a GitHub Release, smoke-tests production, and fast-forwards `develop` back up to `production`.

Every push to `develop` also deploys the develop Worker (dev.tools.codercops.com); production deploys only from `production`.

## Reporting bugs and requesting features

Use the issue templates. For anything security-sensitive, follow [SECURITY.md](./SECURITY.md) instead of filing a public issue.
