# ADR-0008: Testing strategy

- **Status:** Accepted
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya + AI pair
- **Constitution links:** §3.1 (no untested code), §3.3 (lint in CI), §9.3 (budgets), §8.4

## Context

The consumer side is build-free, but the constitution mandates tests, linting and CI. The
resolution (proven by CKCSS): zero-build is a *consumer* property; the *development* side uses
dev-time tooling only.

## Decision

1. **Unit tests:** Node's built-in runner (`node --test`) with **happy-dom** providing
   `HTMLElement`, `customElements`, `document`, etc. DOM-free modules (`reactive.js`,
   `html.js`, `utils.js`) are tested pure. Component tests set up happy-dom globals, then
   dynamically import the component (module side effects register the custom element).
2. **Browser smoke/E2E (pre-1.0):** Playwright against statically served `examples/` — real
   upgrade, morph correctness, **focus retention while typing**, keyboard navigation, and
   nested-component ownership (ADR-0004).
3. **Accessibility:** axe-core scans of example pages in the E2E suite (constitution §3 CI
   requirement; WCAG AA per §5.3).
4. **Lint/format:** ESLint flat config + `eslint-plugin-jsdoc` (JSDoc required on public API —
   this guards the AI-agent goal). Prettier-compatible style (2-space, LF, per `.editorconfig`).
5. **Size gate:** `npm run size` gzips the core modules and fails CI if the total exceeds
   **4 KB min+gzip** (§9.3).
6. **CI:** `.github/workflows/ci.yml` runs lint → unit tests → size gate on every PR; all checks
   block merging (§3.3). E2E joins the pipeline with the Playwright milestone.
7. **All tooling is `devDependencies`.** Nothing a consumer downloads includes a dependency —
   the runtime is and remains zero-dependency (§8.4).

## Considered alternatives (rejected)

- jsdom — heavier and slower than happy-dom for this scale.
- Vitest/Jest — excellent tools, but a built-in runner + one DOM shim is the minimal footprint
  that satisfies §3.1 (§2.1 YAGNI).
- No E2E — morph/focus bugs only reproduce in real browsers; deferred, not dropped.

## Consequences

**Positive:** constitution-compliant quality gates with the smallest possible toolchain.
**Negative / to manage:** happy-dom is not a perfect browser — component tests assert behavior,
and the Playwright milestone owns browser-truth.
