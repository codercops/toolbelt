<!--
Branch off `develop`. Feature PRs target `develop` and are squash-merged.
Release PRs go `develop` → `production` and are merged as a merge commit
(add a release:minor / release:major label if it is not a patch).
-->

## What and why

<!-- What does this change, and what problem does it solve? -->

Closes #

## Type of change

- [ ] Bug fix
- [ ] New tool or feature
- [ ] Tests
- [ ] Refactor or cleanup
- [ ] Docs

## Checklist

- [ ] `npm run lint && npm run test && npm run build` passes locally
- [ ] Logic changes live in `lib/` and have a test in `lib/__tests__/`
- [ ] No analytics, trackers, or calls that send user data off-device
- [ ] Works in both light and dark themes (if UI changed)
- [ ] Inputs have labels and it works with the keyboard alone (if UI changed)
- [ ] New tool: registry entry, `page.tsx`, client component, `opengraph-image.tsx`, and the bug report dropdown are all done

## Notes for reviewers

<!-- Anything worth calling out: tradeoffs, follow-ups, screenshots for UI changes. -->
