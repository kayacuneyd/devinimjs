# DevinimJS

**Build-free, Proxy-reactive Vanilla JS component library for PHP and shared-hosting projects.** The JavaScript companion of [CKCSS](https://github.com/kayacuneyd/ckcss).

> _Devinim_ — Turkish for "motion / kinetics". DevinimJS sets server-rendered HTML in motion.

## Product contract

```html
<script type="module" src="/assets/devinim/core.js"></script>
```

That is the complete consumer installation path. No Node.js, no bundler, no transpiler, no framework runtime — plain ES modules that run directly in the browser. DevinimJS must remain usable on ordinary shared hosting, exactly like CKCSS.

### Build-free compatibility contract

Build is optional for publishing and optimization; it is never a consumer requirement. Every
runtime feature must remain usable as plain browser ES modules under these rules:

1. The runtime has no npm or other runtime dependency.
2. Source modules must run directly in a modern browser without bundling or transpilation.
3. `dist/` artifacts are optional optimized distributions, not the only supported entry point.
4. Build tooling may provide minification, source maps, packaging and type declarations only.
5. No feature may require compile-time template analysis, dependency graphs or code generation.
6. New features must first work in the build-free source runtime, then be added to `dist/`.
7. Shared-hosting deployment must remain possible by copying the published JavaScript files.

This permits runtime improvements such as keyed morphing, store selectors, router support and
cleanup helpers without turning DevinimJS into a build-dependent framework.

Pin a tagged release from jsDelivr (never use an unpinned URL in production):

```html
<script type="module">
  import { BaseComponent, html, define } from 'https://cdn.jsdelivr.net/gh/kayacuneyd/devinimjs@v0.1.0/dist/core.min.js';
</script>
```

## Why?

Freelance and agency projects built with **native PHP, CodeIgniter, Laravel, WordPress and SQLite** rarely justify a frontend build pipeline — yet they still deserve reactive, component-based UIs. DevinimJS gives you a Svelte-like authoring experience (state + template + behavior in one class) with zero build step:

- **Zero build** — native `<script type="module">`, works from any static file host or CDN.
- **Reactive** — `Proxy`-based state; change state, the DOM follows (morph render, see [ADR-0001](adr/0001-render-hydration-strategy.md)).
- **Light DOM only** — no Shadow DOM, so your global CSS (CKCSS) applies directly.
- **PHP-friendly** — initial state comes from `data-*` attributes your backend prints; events arrive as bubbling `dv:*` `CustomEvent`s.
- **Tiny** — core budget: < 4 KB min+gzip, zero runtime dependencies.
- **Predictable** — strict conventions, one base class and JSDoc on public APIs.

## Quick start

```php
<dv-counter data-start="<?= (int)$start ?>" data-step="5"></dv-counter>
<script type="module" src="/assets/devinim/components/dv-counter.js"></script>
```

Authoring a component:

```js
import { BaseComponent, html, define } from '../core/core.js';

export class DvCounter extends BaseComponent {
  static observedAttributes = ['data-start'];

  initialState() {
    return { count: this.num('start', 0) };
  }

  increment() { this.state.count += 1; }
  decrement() { this.state.count -= 1; }

  template() {
    return html`
      <button type="button" data-on:click="decrement" aria-label="Decrease">−</button>
      <output aria-live="polite">${this.state.count}</output>
      <button type="button" data-on:click="increment" aria-label="Increase">+</button>
    `;
  }
}

define('dv-counter', DvCounter);
```

## Documentation

- [Architecture](docs/architecture.md) — module map, lifecycle, data flow
- [PHP integration guide](docs/guides/php-integration.md) — the `data-*` contract, JSON, events, CSP
- [Application runtime guide](docs/guides/application-runtime.md) — async data, forms and hash routing
- [Component contract](docs/component-contract.md) — deterministic component authoring and review rules
- [Component library](design/component-library.md) — component inventory & states
- [ADRs](adr/INDEX.md) — every significant decision, recorded
- [Examples](examples/) — `counter.html` (static) and `counter.php` (PHP-fed)

## Browser support

Baseline 2021+: native ES modules, `Proxy`, Custom Elements v1, private class fields. No transpiled/legacy build is offered — this is a deliberate scope decision ([ADR-0001](adr/0001-render-hydration-strategy.md)).

## Development

Consumers need nothing. Contributors use dev-time tooling only (tests, lint, size gate — the same model as CKCSS):

```bash
npm install
npm test          # unit tests (node --test + happy-dom)
npm run lint      # ESLint + JSDoc rules
npm run size      # assert core < 4 KB min+gzip
```

## License

MIT © [Cüneyt Kaya](https://kayacuneyt.com) — see [LICENSE](LICENSE). Governed by the [KayaEOS Engineering Constitution](constitution.md).
