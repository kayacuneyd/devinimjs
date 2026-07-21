# CLAUDE.md — DevinimJS agent instructions

> Generated-style adapter file per the KayaEOS blueprint. Edit the canonical conventions
> (constitution, ADRs) first, then regenerate/sync this file.

You are working on **DevinimJS**: a build-free, Proxy-reactive Vanilla JS component library
that ships as plain ES modules for PHP/shared-hosting projects. Read `constitution.md` and the
ADRs in `adr/` before architectural work.

## Non-negotiable constraints

1. **No build step for consumers.** Everything in `src/` must run as-is in a modern browser
   via `<script type="module">`. No JSX, no TypeScript syntax, no bare module specifiers —
   always relative imports **with file extensions** (`'../core/core.js'`).
2. **Light DOM only.** Never use `attachShadow`. Components inherit global CSS (CKCSS).
3. **No `eval` / `new Function`** anywhere (CSP safety, ADR-0003/0004).
4. **Zero runtime dependencies.** Dev-time tooling lives in `devDependencies` only.
5. **Escape by default.** Template interpolations go through the `html` tag; raw HTML only via
   `unsafe()`, which requires a security-review note (ADR-0003).

## Component conventions (strictly predictable)

- File: `src/components/dv-kebab-case.js` → Class: `DvPascalCase extends BaseComponent` →
  Tag: `<dv-kebab-case>` registered via `define('dv-kebab-case', DvPascalCase)` at file end.
- One file = one component. Named exports only; never default exports.
- Initial state: override `initialState()` (runs at connect, may read `this.dataset`).
  Read/write state via the reactive proxy: `this.state`.
- Templates: override `template()`, return the `html` tagged template. Control flow is plain JS
  (`.map()`, ternaries, `&&`) — there is no custom template syntax.
- Events: `data-on:event="methodName"` in templates; handlers are class methods with the
  signature `method(event, el)`. Never pass expressions.
- Emit outward with `this.emit('name', detail)` → consumers listen for `dv:name`.
- Composition: `${this.outlet}` renders initial light-DOM children (ADR-0009).
- Attribute helpers: `this.str/num/bool/json(key, fallback)`; live changes via
  `static observedAttributes` + `onAttribute(name, newValue, oldValue)`.
- Lifecycle hooks (optional): `connected()`, `disconnected()`, `updated(changedKeys)`.

## Workflow gates (constitution §3)

- `npm test` (node --test + happy-dom), `npm run lint`, `npm run size` must pass before merge.
- Full JSDoc on every public API — enforced by `eslint-plugin-jsdoc`.
- Significant decisions → new ADR from `adr/_template.md`, indexed in `adr/INDEX.md`.
- Core size budget: **< 4 KB min+gzip** (constitution §9.3); CI enforces it.
