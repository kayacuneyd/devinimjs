# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Core runtime: `createReactive` (Proxy-based deep reactivity), `html` tagged template with
  auto-escaping and boolean-attribute handling, `morph` DOM patcher with `<dv-outlet>` support,
  `BaseComponent` (morph render, event delegation, lifecycle hooks), `define` registry guard,
  `safeUrl` utility.
- Components: `<dv-counter>` (PHP-fed via `data-*`, emits `dv:change`) and `<dv-tabs>`
  (WAI-ARIA APG tabs: roving tabindex, arrow/Home/End keys with wrap-around, automatic
  activation, unique per-instance ids; labels from child `data-tab` attributes).
- Core: `prepare(fragment)` hook on `BaseComponent` — components can derive configuration from
  captured light-DOM children before `initialState()` (ADR-0009 amendment; first consumer:
  `<dv-tabs>`).
- Examples: `counter.html`, `counter.php` (PHP-fed) and `tabs.html`.
- Documentation: architecture, PHP integration guide, component library.
- Decision records: ADR-0001 through ADR-0010.
- Tooling: ESLint flat config, unit tests (`node --test` + happy-dom), size gate script, CI workflow.
