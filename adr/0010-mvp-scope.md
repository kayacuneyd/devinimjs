# ADR-0010: MVP scope

- **Status:** Accepted
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §2.1 (YAGNI), §9.3 (budgets), §1.2

## Context

v0.1.0 must prove the architecture end-to-end (PROJECTIDEA's required output: the core plus one
PHP-fed interactive component) without scope creep.

## Decision

**Core modules (`src/core/`):**

| Module | Responsibility | min-size estimate |
|--------|----------------|-------------------|
| `reactive.js` | `createReactive` — deep Proxy reactivity | ~0.5 KB |
| `html.js` | `html` tag, `HtmlString`, `escapeHtml`, `unsafe` | ~0.8 KB |
| `morph.js` | positional DOM morph + `<dv-outlet>` exemption | ~1.2 KB |
| `base-component.js` | `BaseComponent` — render pipeline, delegation, hooks, attribute helpers | ~0.8 KB |
| `registry.js` | `define()` with guards | ~0.2 KB |
| `utils.js` | `safeUrl` | ~0.3 KB |
| **Total** | budget < 4 KB min+gzip | **~3.8 KB min (~2 KB gzip)** |

**Components:** `<dv-counter>` (the PROJECTIDEA-required PHP-fed example) and `<dv-tabs>`
(ARIA tabs + keyboard navigation — the WCAG AA proof; immediately follows counter).

**Examples:** `examples/counter.html` (static), `examples/counter.php` (PHP-fed).

**Docs:** README install contract, `docs/architecture.md`,
`docs/guides/php-integration.md`, `design/component-library.md`.

**Post-MVP candidates (YAGNI-tagged, each needs its own ADR):** shared cross-component store,
hash-based micro-router, named outlets, form-associated components (`ElementInternals`), keyed
list morph (`data-key`), `.d.ts` typings, `scripts/build-dist.mjs` minification pipeline.

## Considered alternatives (rejected)

- Bigger first release (store + router + more components) — violates §2.1; the architecture must
  earn additions through real use.
- Counter only — tabs are the accessibility evidence the constitution demands; both stay.

## Consequences

**Positive:** a small, fully testable v0.1.0 with a clear definition of done.
**Negative / to manage:** real app needs (store/router) will pressure the roadmap — handled via
the retrospective + ADR process (§7), not by smuggling scope into v0.1.
