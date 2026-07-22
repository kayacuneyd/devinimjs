# Component Contract

This contract makes every DevinimJS component predictable to author, review and maintain.

## Required files

For a component named `dv-example`, create:

```text
src/components/dv-example.js
tests/unit/dv-example.test.js
docs/components/dv-example.md
```

Register it in `docs/component-manifest.json`, `design/component-library.md` and the Unreleased
section of `CHANGELOG.md`.

## Naming and API

| Concern | Contract |
|---|---|
| Tag | Lowercase custom-element name, kebab-case; reserve `dv-` for DevinimJS components |
| Class | Matching PascalCase name, e.g. `DvExample` |
| File | Exact tag name, e.g. `dv-example.js` |
| Registration | Explicit `define('dv-example', DvExample)` at module end |
| Configuration | `data-*` attributes; live attributes declared in `observedAttributes` |
| Events | `dv:*`, emitted through `this.emit()` |
| Markup | `template()` returns `html``; untrusted values are interpolated, never `unsafe()` |
| Composition | Preserve server/consumer children through `${this.outlet}` when children are supported |

## Lifecycle and resources

- `initialState()` defines initial reactive state.
- `onAttribute()` is the only live attribute-to-state synchronization point.
- `connected()` is for first-connection setup; `reconnected()` handles later attachments.
- `listen()` and `onCleanup()` own timers, observers and external listeners.
- `updated(changedKeys)` is for post-render synchronization only.

## Accessibility and quality

Every interactive component must define its default, empty, loading, error and disabled states
when applicable. Native controls are preferred. Keyboard behavior, focus management and ARIA
semantics must be tested in a real browser.

Before merging, run:

```bash
npm run verify
```

## Generator

```bash
npm run create:component -- app-example
```

Use `--dry-run` to inspect generated paths and `--force` only when replacing deliberate local
work. The generator never edits the manifest or design inventory automatically; those API
decisions require review.
