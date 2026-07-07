# Security policy

## Reporting a vulnerability

Please report security issues privately. Do not open a public GitHub issue for anything exploitable.

- Email **support@codercops.com** with a description, steps to reproduce, and the impact.
- Alternatively, use GitHub's private ["Report a vulnerability"](https://github.com/codercops/toolbelt/security/advisories/new) flow.

We aim to acknowledge reports within a few business days and will keep you updated as we work on a fix. Please give us reasonable time to release a patch before any public disclosure.

## Scope

toolbelt runs entirely in the browser and has no backend or user accounts, so the relevant surface is client-side. Things we especially want to hear about:

- Cross-site scripting in any tool that renders user input (JSON tree view, JWT claims, invoice preview, syntax highlighting).
- Ways to bypass or weaken the Content-Security-Policy set in `middleware.ts` and `next.config.js`.
- The JWT tool or invoice tool leaking sensitive input (tokens, PII) off-device, for example into the URL, storage, or a network request.
- Supply-chain or dependency issues that affect what ships to users.

## Out of scope

- Reports that require a malicious browser extension or a compromised device.
- Denial of service from pasting enormous inputs (these are local, single-user tools).
- Missing security headers on a self-hosted fork that has changed the provided config.

## Supported versions

This is a continuously deployed web app. Only the latest `main` (and what is live at tools.codercops.com) is supported.
