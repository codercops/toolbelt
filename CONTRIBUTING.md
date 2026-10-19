# Contributing to toolbelt

Thanks for taking the time to help. This project is a small, careful collection of browser-based developer tools, and the bar is simple: everything runs client-side, nothing leaks, and the code stays readable.

## Hacktoberfest 2026

We're taking part in Hacktoberfest this year, and first-time contributors are very welcome.

1. Pick an open issue labeled [`hacktoberfest`](https://github.com/codercops/toolbelt/issues?q=is%3Aissue+is%3Aopen+label%3Ahacktoberfest+no%3Aassignee) or [`good first issue`](https://github.com/codercops/toolbelt/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22+no%3Aassignee) that nobody is assigned to. Want to build a whole new tool? Look at the [`new tool`](https://github.com/codercops/toolbelt/issues?q=is%3Aissue+is%3Aopen+label%3A%22new+tool%22) issues.
2. Comment on it to ask for it. I'll assign it to you, usually within a day. Please don't start on an issue that's assigned to someone else.
3. Take one issue at a time. Once your PR is merged, grab the next one. After 3 merged PRs with us you can hold two issues at once.
4. If you're assigned and there's no PR or update for 5 days, I'll free the issue up for someone else. Just comment if you need more time.
5. Open your PR against `develop` here in codercops/toolbelt and put `Closes #<issue number>` in the description. A PR merged inside your own fork never reaches us, so it doesn't count. A check on the PR ("Claim check") fails if that issue isn't assigned to you. Another one ("Description check") fails while the "How I tested this" or "AI assistance" section of the description is missing or empty.

PRs count for Hacktoberfest once they're merged or labeled `hacktoberfest-accepted`. PRs that aren't linked to an issue, only reformat code, or change things nobody asked for will be closed, and spammy ones get the `spam` label. If you have an idea that isn't an issue yet, open an issue first so we can agree on it before you write code. The full rules are under [Ground rules](#ground-rules) below.

Stuck? Ask on the issue, or in `#oss-help` on our [Discord](https://discord.gg/mpGdJyjaRQ). Questions are welcome. Claims still happen on the issue, so the assignment stays visible to everyone.

## Ground rules

### AI tools

You can use AI tools (Copilot, ChatGPT, Claude, Cursor and so on). Two conditions:

1. Say so in the PR. If a tool wrote or rewrote more than autocomplete-sized pieces, fill in the "AI assistance" line in the PR template: which tool, and what you used it for.
2. You own every line. Run it, test it, and be ready to explain it in review. If you can't explain a change, the PR gets closed.

PRs that are unreviewed AI output (code that doesn't run, invented APIs, a description that doesn't match the diff, unrelated rewrites) are treated as spam.

### Spam

These get closed and labeled `spam`:

- a PR for an issue that isn't assigned to you, or that isn't linked to an issue at all
- formatting, whitespace or typo-only changes nobody asked for
- one fix split into several PRs
- a copy of someone else's PR
- claiming a pile of issues at once, or bulk and automated submissions
- untested generated code

Two spam PRs and you won't be assigned more issues this month, and you're out of the CODERCOPS goodies.

### Reviews

Every PR needs a "How I tested this" line: what you ran or clicked through to check it works.

For a bug fix, check that your new test fails without the fix: undo the change in the source, run the tests, then put it back. A test that passes either way doesn't catch anything.

I review most PRs within a few days. Please don't ping repeatedly or DM maintainers about a review. If three days pass with no reply, one follow-up comment on the PR is fine.

### Goodies

The top 5 contributors this October get a CODERCOPS T-shirt and stickers. You need at least 5 merged PRs labeled `hacktoberfest-accepted` across chatcops, ogcops, toolbelt and discord-bot, merged between Oct 1 and Oct 31 (UTC), and ties go to whoever got there first. To keep it fair:

- only PRs for issues that were assigned to you count
- a fix split into several PRs counts once
- what counts is the maintainers' call, and that call is final

These goodies come from CODERCOPS through our own open source program. They're separate from Hacktoberfest, so anything Hacktoberfest itself gives out is a different thing with its own rules.

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

CI also builds the Cloudflare Worker and requests every page from it in local workerd. If that step fails while `npm run build` passes locally, run `npm run preview` and open the page the CI log names; the error shows up in the terminal.

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
   - Pick `accentVar` from the accent variables in `app/globals.css` (`--cyan`, `--amber`, `--violet`, `--sky`, `--lime`, `--green`, `--fuchsia`) and set `accentHex` to that variable's dark-theme value. Take one that no tool uses yet. If they're all taken, reuse the one the fewest tools have. Don't use `--rose`: it's the color of error messages.
   - `heroDim` must be `""` or part of `heroHeading`.
   - Write 3 or 4 FAQs. Keep `metaTitle` under 60 characters and `metaDescription` around 150 to 160.
   - Keep `features` and `ogDescription` to plain Latin text; the social card font has no arrows or symbols.
2. Create `app/(tools)/<slug>/page.tsx`, a `<Name>Client.tsx` client component, and `opengraph-image.tsx`. Copying `page.tsx` and `opengraph-image.tsx` from `app/(tools)/base64/` and changing the slug is the easiest start.
3. Put pure logic in `lib/<name>.ts` with tests in `lib/__tests__/<name>.test.ts`. Tests can import with `@/` like the app does.
4. Add the tool to the "Which tool?" dropdown in `.github/ISSUE_TEMPLATE/bug_report.yml`.

The home page, metadata, JSON-LD, sitemap, manifest and command palette pick the new tool up from the registry automatically. Several people may be adding tools at the same time, so rebase on `develop` before asking for review.

## Branching and releases

toolbelt follows the standard CODERCOPS flow:

- `develop` is the default and integration branch; `production` is the deployed branch (tools.codercops.com). Never commit directly to either.
- Start every change on a branch off `develop`: `feat/*`, `fix/*`, `chore/*`, or `docs/*`.
- Open a PR into `develop` and **squash and merge** it (one squashed commit per feature). Use conventional commit titles (`feat:`, `fix:`, `chore:`, `docs:`). CI (lint, tests, build, and the page check on the built Worker) must be green.
- A release is a PR from `develop` into `production`, merged as a **merge commit** (not squash), so production keeps full history. Bump the `package.json` version in that PR, and add a `release:minor` or `release:major` label if it is not a patch.
- Merging the release PR runs the Release workflow: it tags `vX.Y.Z`, publishes a GitHub Release, smoke-tests production, and fast-forwards `develop` back up to `production`.

Every push to `develop` also deploys the develop Worker (dev.tools.codercops.com); production deploys only from `production`.

## Reporting bugs and requesting features

Use the issue templates. For anything security-sensitive, follow [SECURITY.md](./SECURITY.md) instead of filing a public issue.
