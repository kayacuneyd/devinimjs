# DevinimJS Architecture

One page version: **`UI = f(state)`** — a component's `template()` renders its reactive state to
a string; a small morph patches the real DOM in place. All decisions: see `adr/INDEX.md`.

## Module map (`src/`)

```
src/
├── core/
│   ├── reactive.js         createReactive(state, onChange) — deep Proxy reactivity
│   ├── html.js             html`` tag · HtmlString · escapeHtml · unsafe (XSS boundary)
│   ├── morph.js            morph(host, htmlString) — keyed/positional in-place DOM patching
│   ├── base-component.js   BaseComponent — the class every component extends
│   ├── registry.js         define(tag, ctor) — guarded custom-element registration
│   ├── store.js            createStore(initial) — shared cross-component state (ADR-0011)
│   ├── async-state.js      createAsyncState(data) — stale-safe async lifecycle
│   ├── fetch.js            fetchJson(url) · HttpError
│   ├── form.js             createForm(initialValues) — values/errors/submission state
│   ├── router.js           createHashRouter() — serverless hash route matching
│   ├── utils.js            safeUrl
│   ├── core.js             small widget-runtime public API barrel
│   └── app.js              optional application-runtime public API barrel
├── components/
│   └── components/         <dv-counter>, <dv-tabs>, disclosure, modal, toast, pagination
└── devinim.js              all-in-one entry (core + all components, self-registering)
```

No build step, no runtime dependencies, Light DOM only (global CSS/CKCSS applies directly).

## Component lifecycle

```
<dv-counter data-start="5">            PHP/static HTML prints element + data-* config
            │
connectedCallback (once, guarded)
            │
   1. capture children ───────────► DocumentFragment (ADR-0009, for ${this.outlet})
   2. initialState() ─────────────► createReactive(state, notify)
   3. render: template() ─────────► HtmlString ──► morph(this, string)
   4. place outlet children ──────► into <dv-outlet> (display: contents)
   5. delegate events ────────────► one listener per data-on:* type on the element
   6. connected() hook
            │
state mutation (e.g. this.state.count += 1)
            │
   notify → batch (microtask) ────► re-render + morph ──► updated(changedKeys)
            │
   only changed nodes/attributes are patched; focus & listeners survive (ADR-0001/0004)
```

## The five rules everything derives from

1. **Morph render** (ADR-0001/0014): templates produce strings; `morph` patches in place.
   Sibling lists whose elements all carry a unique `data-key` preserve node identity through
   reorders; all other structures use positional nodeType+nodeName matching.
2. **Escape by default** (ADR-0003): interpolations are escaped unless they are `HtmlString`
   (produced by `html`` ` or the reviewed `unsafe()`).
3. **Delegated events** (ADR-0004): `data-on:click="method"` — one root listener per type;
   ownership = nearest custom-element boundary, `<dv-outlet>` exempt.
4. **Explicit attribute sync** (ADR-0005): `initialState()` reads `data-*` via
   `str/num/bool/json`; live sync via `observedAttributes` + `onAttribute`.
5. **Outlet composition** (ADR-0009): `${this.outlet}` keeps consumer/PHP children; morph
   never recurses into `<dv-outlet>`; nested components upgrade independently.

## Performance notes (constitution §9)

- Core budget: < 4 KB min+gzip, enforced in CI (`npm run size`). Currently ~2.8 KB.
- One render per microtask no matter how many mutations; unchanged attributes/nodes untouched.
- No virtual DOM, no dependency graph, no parser — the morph remains deliberately small.
