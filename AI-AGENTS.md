# AI-AGENTS.md — DevinimJS (AGENTS.md standard)

> Tool-agnostic mirror of `CLAUDE.md` for agents that follow the AGENTS.md convention.
> Keep both files in sync; canonical conventions live in `constitution.md` and `adr/`.

## Mission

DevinimJS is a build-free, Proxy-reactive Vanilla JS component library (ES modules, Light DOM,
zero runtime dependencies) for PHP/shared-hosting projects — the JS companion of CKCSS.

## Rules for any AI agent

1. Ship plain browser-ready ES modules: relative imports with extensions, no transpilation,
   no JSX/TS, no bare specifiers.
2. Never use Shadow DOM, `eval`, or runtime dependencies.
3. Follow the component contract exactly:
   `src/components/dv-*.js` → `class Dv* extends BaseComponent` → `define('dv-*', Dv*)`.
   Use `initialState()` + `this.state`, `template()` + `html` tag, `data-on:event="method"`,
   `this.emit()`, `${this.outlet}`, `this.str/num/bool/json`.
4. JSDoc on all public API; tests in `tests/unit/`; docs and CHANGELOG updated with code.
5. Gates before done: `npm test`, `npm run lint`, `npm run size` (core < 4 KB min+gzip).
6. Architectural changes require an ADR (`adr/_template.md`) indexed in `adr/INDEX.md`.
7. Human reviews everything; AI output is a first draft (constitution §6).

## Key files

- `src/core/` — reactive.js · html.js · morph.js · base-component.js · registry.js · utils.js
- `adr/INDEX.md` — decision records (read ADR-0001 first)
- `docs/guides/php-integration.md` — the consumer contract
- `design/component-library.md` — component inventory & states
