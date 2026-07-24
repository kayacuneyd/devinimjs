# ADR-0020: Starter kits — CKCSS pattern + DevinimJS component compositions

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §1, §2, §9

## Context

The ecosystem goal is to let real, industry-standard applications get built faster and cheaper —
without falling back to generating every page from scratch through an LLM each time ("token
waxing"). Two prerequisites for that already exist and are mature:

- CKCSS just finished its "UI Kit Patterns" initiative: real, accessible, token-led static page
  patterns for auth, e-commerce, marketing and application/CRUD use cases
  (`ckcss/docs/product/patterns.md`).
- DevinimJS has 16 shipped, tested, i18n'd, WCAG-pattern components (`design/component-library.md`).

Nothing connects the two. CKCSS patterns are deliberately JS-free
(`ckcss/docs/product/patterns.md`: "Do not require JavaScript... to render the basic pattern" —
CKCSS's own constitutional boundary, its ADR-0003/ADR-0013). `create:project` (ADR-0016) only
scaffolds a single `<dv-counter>` demo. There is no starter that composes a real CKCSS pattern
with real DevinimJS components into a working, copyable page.

## Decision drivers

- Must not weaken CKCSS's JS-free pattern guarantee — that boundary belongs to CKCSS, not to us.
- Must not invent a new component API or authoring pattern — reuse the existing `data-*`
  declarative contract exactly as documented.
- Must prove the mechanism cheaply before committing to a library of kits (constitution §2 YAGNI).

## Considered options

### Option A — Edit CKCSS's pattern files directly to add `dv-*` elements

Rejected: violates CKCSS's own pattern rule that a pattern must render without JavaScript.
Editing `ckcss/site/data-management.html` to require `<dv-data-table>` would break that guarantee
for every consumer of CKCSS's own canonical pattern, not just kit consumers.

### Option B — A generic "compose any pattern with any components" CLI

Rejected for now: unbounded scope, no proof the mechanism is even useful yet. Exactly the kind of
speculative generality §2's 3-pass rule exists to block.

### Option C — One concrete pilot kit, DevinimJS-owned, `create:project --kit=<name>`

Chosen. A kit is a new, DevinimJS-owned source artifact under `kits/<name>/` — visually and
structurally based on a named CKCSS pattern (cited by path) but never editing CKCSS's own files.
It is allowed to require JavaScript because DevinimJS's own constitution already waives
progressive enhancement for the component runtime (§5) — the kit is a DevinimJS product surface,
not a CKCSS one. `scripts/create-project.mjs` gets one new flag, `--kit=<name>`, generating the
kit's static HTML plus the exact `dist/modules/dv-*.js` files it uses — no new build tooling, no
new component API, no new component-authoring pattern.

## Decision

Build one pilot kit: **`admin-dashboard`**, composing CKCSS's `data-management.html` pattern
region with `<dv-data-table>` (built-in filter/sort/pagination), `<dv-modal>` +
`<dv-field>` (create flow), `<dv-confirm>` (delete), and `<dv-toast-stack>` (feedback) — the
combination that uses the most components together and most directly demonstrates a real
CRUD admin screen. Auth and marketing-landing kits are explicitly deferred until this pilot
proves the mechanism (constitution §2).

All kit data flows through the existing declarative `data-*` contract only
(`data-rows`/`data-columns` on `<dv-data-table>`, `data-open` on `<dv-modal>`,
`toastStack.show(message)`, `dv-confirm`'s `dv:confirm`/`dv:cancel`). A small page-owned
`<script type="module">` wires these together — the same "page owns the glue" model every other
DevinimJS example already uses (`examples/counter.html`), not a new framework feature.

## Consequences

**Positive:**
- Proves the CKCSS-pattern + DevinimJS-component composition mechanism with one concrete,
  verifiable artifact instead of a speculative multi-kit library.
- `docs/guides/starter-kit.md` gains a real "assemble a working admin screen in one command"
  story, directly answering the "can we produce ready kits without token-wasting AI generation"
  question this task originated from.

**Negative / to manage:**
- Found and fixed a real pre-existing bug as a prerequisite: `scripts/build-dist.mjs`'s
  `dist/modules/<name>.js` generation left `../core/i18n.js`, `../core/transition.js` and each
  component's own `./<name>.locale.js` as unresolved relative imports — fine inside this repo's
  own `dist/` tree, but a 404 for any of the 14 i18n/transition-using components the moment the
  file is copied elsewhere, exactly what `create:project` and `docs/guides/starter-kit.md`'s
  "copy further `dist/modules/*.js` files" guidance both do. Fixed by bundling those relative
  imports into each component's own `dist/modules/<name>.js` (esbuild `stdin` + `resolveDir:
  'src/components'` + `bundle: true`), while keeping `dv-data-table`'s one cross-component import
  (`./dv-pagination.js`) external/unbundled on purpose — inlining it would make two
  independently-loaded modules each call `define('dv-pagination', …)`, which throws on the second
  registration. Regression-tested in `tests/unit/dist-modules-self-contained.test.js`.
- Per-module bundle sizes grew slightly (i18n/transition helpers are no longer shared across
  modules the way `core.min.js` is) — acceptable: every `dist/modules/*.js` file is still under
  4 KB, and none of this counts against the `src/core/core.js` size gate (`npm run size` measures
  only the core bundle).

**Follow-ups:**
- Auth kit and marketing-landing kit — separate future tasks once this pilot is validated in use.
- `--format=php` support for kits — deferred, no immediate driving use case.
- Self-hosting CKCSS's CSS inside generated kit output — unrelated pre-existing pattern
  (`create-project.mjs` already uses a pinned CDN link for `ckcss.min.css`), not this task's
  concern.
