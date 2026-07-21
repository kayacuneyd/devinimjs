# ADR-0003: Escaping & XSS policy

- **Status:** Accepted
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya + AI pair
- **Constitution links:** §8.1 (never trust user input), §3.4 (security review), §8.4, §9.3
- **Depends on:** ADR-0001, ADR-0002

## Context

In the morph-render model, state values are interpolated into an HTML string that is later
assigned via `innerHTML` (through `<template>`). Without a strict policy this is a textbook
XSS vector.

## Decision

1. **Escape by default.** Every primitive interpolated into an `html` template is escaped:
   `& < > " '` → HTML entities. Automatic, non-skippable.
2. **Trust brand.** The `html` tag returns a `HtmlString` instance. Only `HtmlString`s pass
   through interpolations unescaped — escaping happens exactly once, at template creation.
3. **Conscious opt-out only.** `unsafe(rawHtml)` wraps raw HTML as trusted. The name is
   intentionally alarming, JSDoc carries a warning, and every usage requires a security-review
   note in the PR (constitution §3.4; enforced via `CONTRIBUTING.md`).
4. **The attribute boundary carries data, never markup.** Attribute helpers
   (`this.json()`, `this.str()`, …) never return `HtmlString`. Anything PHP prints is data and is
   escaped on interpolation.
5. **URL hygiene.** `safeUrl()` (core util) allows `http:`, `https:`, `mailto:`, `tel:` and
   relative paths; everything else (e.g. `javascript:`) degrades to `'#'`. User-controlled URLs
   may only reach `href`/`src` through `safeUrl()`. Mandatory in framework-owned components.
6. **PHP-side contract** (documented in `docs/guides/php-integration.md`): every value printed
   into an attribute goes through `htmlspecialchars($v, ENT_QUOTES)`; JSON via
   `htmlspecialchars(json_encode($v), ENT_QUOTES)`.
7. **CSP compatibility.** The library contains no `eval` / `new Function` and no inline event
   handlers; it runs under `script-src 'self'` (or a pinned CDN origin). A recommended CSP
   snippet ships in the docs.

## Considered alternatives (rejected)

- Manual escaping discipline (Reef-style default) — humans forget; violates §8.1's spirit.
- DOMPurify dependency — ~20 KB, blows the size budget and §8.4; unnecessary because templates
  are developer-authored and user data is escaped by default.

## Consequences

**Positive:** injection-safe by default with an auditable, greppable escape hatch.
**Negative / to manage:** `unsafe()` misuse is still possible — mitigated by review policy and
documentation, not by technology.
