# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Component error boundary (ADR-0015): `onError(error, phase)` lifecycle hook, called when
  `template()` throws during a render or an action method throws during dispatch. Default
  behavior (rethrow) is unchanged for every existing component; overriding it contains the
  error instead. Available in both the `BaseComponent` class API and as `config.onError` in the
  `component()` factory.

### Tests

- Deepened unit coverage for `dv-autocomplete`, `dv-data-table`, `dv-dropdown`, `dv-modal`,
  `dv-field`, `dv-toast-stack` and eight further components with edge-case, keyboard and
  cleanup-timing tests (TASK-003; 90 → 137 tests), including a passing test that documents
  `dv-modal`'s known lack of focus-trap cycling (`docs/roadmap.md` P1).

## [0.6.0-beta.0] - 2026-07-22

### Added

- Experimental AI-first `component()` authoring entry (`devinimjs/authoring`) for ordinary,
  build-free `.dv.js` components.
- Typed, live and read-only `data-*` props; compact `state`, `sync`, `actions` and `view`
  contract; concise `on:event="action"` directives with legacy `data-on:event` compatibility.
- `dist/authoring.min.js`, browser-direct example, generator `--format=dv` and
  `npm run validate:component -- tag-name` delivery-contract check.
- English and Turkish AI-first documentation pages, AI reference updates and a live docs demo.

### Changed

- `<dv-counter>` and `<dv-search>` now use the factory API while preserving tags, attributes,
  events and existing consumer behavior.
- `requestUpdate()` avoids adding an extraneous external change marker when state already owns
  the current render batch.

## [0.3.0] - 2026-07-22

### Added

- Atomic components: `<dv-dropdown>`, `<dv-search>` and `<dv-product-card>`.
- Shared cart store example and a live component catalog at `/components/`.

## [0.2.0] - 2026-07-22

### Added

- Keyed morphing (ADR-0014): direct sibling lists whose elements all declare unique `data-key`
  values now retain DOM identity across reorders, insertions and removals. Mixed or invalid keyed
  ranges safely fall back to positional morphing.
- Application helpers: `createAsyncState`, `fetchJson`/`HttpError`, `createForm`, path-filtered
  `useStore`, reconnect-safe store subscriptions, cleanup helpers and `createHashRouter`.
- Components: `<dv-disclosure>`, `<dv-modal>`, `<dv-toast>` and `<dv-pagination>` with unit and
  real-browser E2E coverage.

## [0.1.0] - 2026-07-21

The first public release: a build-free, Proxy-reactive component runtime plus two accessible
components, shipped as plain ES modules for PHP/shared-hosting projects.

### Added

- Core runtime: `createReactive` (Proxy-based deep reactivity), `html` tagged template with
  auto-escaping and boolean-attribute handling, `morph` DOM patcher with `<dv-outlet>` support,
  `BaseComponent` (morph render, event delegation, lifecycle hooks, attribute helpers),
  `define` registry guard, `safeUrl` utility.
- Shared store (ADR-0011): `createStore`, `BaseComponent.useStore()` with auto-unsubscribe,
  and `requestUpdate()` for external data sources.
- Components: `<dv-counter>` (PHP-fed via `data-*`, emits `dv:change`) and `<dv-tabs>`
  (WAI-ARIA APG tabs: roving tabindex, arrow/Home/End keys with wrap-around, automatic
  activation with `focusin` sync, unique per-instance ids; labels from child `data-tab`
  attributes).
- Core: `prepare(fragment)` hook on `BaseComponent` (ADR-0009 amendment; first consumer:
  `<dv-tabs>`).
- Examples: `counter.html`, `counter.php` (PHP-fed) and `tabs.html`.
- Distribution (ADR-0007): committed `dist/` artifacts — `core.js`, `core.min.js`,
  `devinim.min.js`, per-component `dist/modules/`.
- Documentation: architecture, PHP integration guide, component library.
- Decision records: ADR-0001 through ADR-0014 (0012–0014 proposed).
- Tooling: ESLint flat config, 44 unit tests (`node --test` + happy-dom), E2E suite
  (Playwright, real Chromium) with axe-core WCAG A/AA scans (zero violations), size gate
  (core: 2.5 KB min+gzip, budget 4 KB), CI workflow.

### Fixed (caught by the E2E layer)

- Event dispatch no longer relies on dynamic attribute selectors — colon-containing
  `data-on:*` names made them invalid in real browsers (happy-dom had tolerated them).
  Directive resolution now walks up from `event.target` (ADR-0004 amendment).
