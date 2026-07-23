# Component Contract

This contract makes every DevinimJS component predictable to author, review and maintain.

## Authoring paths

DevinimJS supports two authoring paths:

- **AI-first `.dv.js` (experimental v0.6):** use `component()` from `core/authoring.js` with
  `props`, `state`, `sync`, `actions` and `view`. This is the recommended path for new, ordinary
  components and for AI-generated code.
- **Class API:** extend `BaseComponent` directly when a component needs advanced lifecycle or
  structural control. This API remains supported and is the lower-level escape hatch.

## Required files

For a component named `dv-example`, create:

```text
src/components/dv-example.dv.js
tests/unit/dv-example.test.js
docs/components/dv-example.md
```

Register it in `docs/component-manifest.json`, `design/component-library.md` and the Unreleased
section of `CHANGELOG.md`.

Generate the AI-first form with:

```bash
npm run create:component -- dv-example --format=dv
```

## AI-first API

```js
import { component, html } from '../core/authoring.js';

component('acme-counter', {
  props: { start: 0, step: 1 },
  state() { return { count: this.props.start }; },
  sync: { start(value) { this.state.count = value; } },
  actions: { increment() { this.state.count += this.props.step; } },
  view() { return html`<button on:click="increment">${this.state.count}</button>`; },
});
```

`props` map to typed, live `data-*` attributes. The default value determines the type: strings,
numbers, booleans and JSON arrays/objects are supported. Use `on:event="action"` in new code;
the existing `data-on:event="action"` spelling remains supported.

## Class naming and API

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
- `onError(error, phase)` — optional (ADR-0015). Called when `template()` throws during a render
  or an action throws during dispatch (`phase` is `'render'` or `'action'`). Default: rethrows,
  so an uncaught component leaves no different a trace than before this hook existed. Override
  to contain the error (fallback state, reporting) instead of leaving it uncaught.

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

Pass `--format=dv` for the AI-first `.dv.js` template. The default remains `class` during the
v0.6 experimental period.

Use `--dry-run` to inspect generated paths and `--force` only when replacing deliberate local
work. The generator never edits the manifest or design inventory automatically; those API
decisions require review.
