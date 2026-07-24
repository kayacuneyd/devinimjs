# Competitive position & roadmap

Snapshot date: 2026-07-23. This is a living reference for where DevinimJS stands against
comparable build-free/lightweight JS libraries, and which gaps are worth closing next — not a
decision record (see `adr/` for those) and not a changelog (see `CHANGELOG.md`). Update it when
the landscape or the gap list materially changes; don't let it silently rot.

## Positioning

DevinimJS aims to be two things at once: the deepest browser-interaction companion for the
build-free PHP full-stack framework DizgePHP (`/var/www/dizgephp`), and a standalone,
fast-to-learn, fast-to-build JS runtime — for human developers and AI coding agents alike.

## Competitive landscape

| | Bundle (gzip) | Model | Component system | Light-DOM / CSS fit | AI-authoring contract |
|---|---|---|---|---|---|
| **DevinimJS** | **3.35 KB** (budget 4 KB, CI-gated, `scripts/size-check.mjs`) | Proxy state + class/factory components + keyed morph render | Yes — `BaseComponent` + `component()` factory | Light DOM only, by design | `component()` 5-field contract + `site/llms.txt`/`llms-full.txt` + `create:component`/`validate:component` CLI |
| Alpine.js | 7.1 KB | Attribute directives (`x-data`, `x-show`) | No component class | Light DOM | None dedicated; wins on sheer training-data familiarity |
| htmx | ~16 KB | Hypermedia, server round-trip per interaction | No | Light DOM | None dedicated |
| Datastar | 14.4 KB | Alpine+htmx hybrid over SSE | No | Light DOM | None dedicated; young ecosystem |
| Lit | ~5 KB | Real Web Components | Yes | Shadow DOM by default — fights a CKCSS-style global-CSS stack | None dedicated |
| Stimulus | 10.9 KB | Controllers, minimal reactivity | Loose | Light DOM | None dedicated |
| Petite-Vue | ~6 KB | Vue-lite progressive enhancement | Loose | Light DOM | None dedicated; low recent maintenance velocity |

### Where DevinimJS already wins

1. **Smallest footprint with the most capability.** Real component classes, reactive state and
   keyed-list morphing, all under 3.35 KB — every competitor above is bigger while offering less
   structure (Alpine/htmx/Datastar) or fighting the CSS story (Lit's Shadow DOM).
2. **Only one with a *designed* AI-authoring contract**, not incidental AI-friendliness:
   `component()`'s 5 named fields, `site/llms.txt`, and a scaffold+validate CLI
   (`scripts/create-component.mjs`, `scripts/validate-component.mjs`).
3. **Deepest first-party full-stack pairing.** DizgePHP's `dv()`/`dv_bridge()` plus its ADR-0005
   server-authoritative `Patch` protocol is a level of framework-specific integration none of the
   generic competitors above have with any PHP framework.
4. **Light DOM only, permanently** (`src/core/base-component.js`, never `attachShadow`) — CKCSS
   applies directly, a structural advantage over Lit for exactly this stack.
5. **Unusually rigorous ADR/constitution-driven process** for a project this size — itself a
   trust/predictability differentiator, especially for AI agents that benefit from explicit,
   compact contracts (mirrors DizgePHP's own `bin/dizge inspect --json` philosophy).

## Prioritized gaps

### P0 — blocks the "learn and build fast" claim directly

All three closed 2026-07-23 via `docs/swarm/` TASK-001/002/003 (Controlled Agent Swarm — see
`docs/swarm/active-work.md` and `docs/swarm/reviews/TASK-001-003-orchestrator-review.md`).

- ~~**No project scaffolding/starter-kit.**~~ Closed by ADR-0016: `npm run create:project --
  <target-dir> [--format=static|php]` (`scripts/create-project.mjs`,
  `docs/guides/starter-kit.md`). No `npx devinimjs create` entry yet — deliberately deferred, see
  ADR-0016's follow-ups.
- ~~**Component test coverage lags the catalog.**~~ Closed: 90 → 144 tests, deep edge-case/
  keyboard/cleanup coverage added for `dv-autocomplete`, `dv-data-table`, `dv-dropdown`,
  `dv-modal`, `dv-field`, `dv-toast-stack`, plus at least one edge case for every remaining
  component. Surfaced and fixed two real pre-existing bugs as a side effect: `dv-field`'s
  unquoted `hidden=` attribute (a11y) and `dv-cart`'s `remove()` shadowing the native
  `Element.prototype.remove()` (renamed to `removeItem`) — see `CHANGELOG.md`.
- ~~**No `.d.ts` type declarations.**~~ Closed by ADR-0017: generated from existing JSDoc via
  `npm run build:types` (`typescript` devDependency, declaration-only, never bundled into
  `dist/`). `package.json`'s `types` field and every `exports` entry resolve to real types.
  Known gap: some internal modules (`morph.js`, `component()`'s `this` context) still have loose
  `checkJs` diagnostics, tracked as advisory in ADR-0017 rather than blocking.

### P1 — competitive parity / DizgePHP-companion leverage

- ~~`dv-data-table` has no pagination/filtering/virtualization.~~ Pagination and filtering closed
  2026-07-24 via TASK-004 (`docs/swarm/`): client-side text filter + `data-page-size`-gated
  pagination composing `<dv-pagination>`, sort now numeric-aware. Virtualization deliberately
  still out — a real architectural change (already-loaded-rows assumption), needs its own
  measurement-backed ADR per §2.1 YAGNI; not reopened.
- ~~`dv-pagination` is Prev/Next only — no page-number list or jump-to-page.~~ Closed 2026-07-24
  via TASK-005: truncated page-number list (7-slot window with `…` ellipsis) plus a jump-to-page
  form, `data-page`/`data-total`/`data-size`/`dv:page` contract unchanged.
- ~~No selector-based store subscriptions.~~ Stale claim, corrected 2026-07-24: `BaseComponent
  #useStore(store, paths)` (`src/core/base-component.js`) already accepts a path/predicate filter
  and only re-renders on matching changes, with test coverage
  (`tests/unit/store.test.js`: "useStore filters unrelated state paths…"). ADR-0011 §4 was written
  before this shipped; no gap here, no follow-up task needed.
- ~~No animation/transition primitives anywhere.~~ Closed 2026-07-24 via TASK-007 for `dv-modal`/
  `dv-toast`/`dv-toast-stack`/`dv-disclosure`: a new `awaitTransition` primitive
  (`src/core/transition.js`, ADR-0018, kept outside the size-gated `core.js` export barrel) defers
  DOM teardown until a real CSS transition (or a timeout fallback) completes. `dv-tabs`'
  panel-crossfade is a different state-machine shape (both panels stay mounted) and remains open —
  tracked as a follow-up in ADR-0018, not forced into this primitive's shape.
- ~~`dv-modal` has no real focus-trap cycling or nested-modal handling.~~ Closed 2026-07-24 via
  TASK-006: WAI-ARIA APG Tab-cycling focus trap plus a module-level open-modal stack so only the
  topmost dialog traps Tab when modals nest.
- **Partially closed 2026-07-24 via TASK-008.** The primitive now exists
  (`src/core/i18n.js`'s `t`/`registerLocales`/`setLocale`, ADR-0019, kept outside the size-gated
  `core.js` export barrel — same exclusion pattern as ADR-0018's transition primitive) with `en`/
  `tr` bundles, wired into three reference components (`dv-modal`, `dv-confirm`, `dv-cart`) that
  deliberately exercise the single-string, multi-string, and parameterized-string cases. Locale
  bundles are co-located per-component by design, specifically so wiring the remaining ~10
  components (`dv-autocomplete`, `dv-data-table`, `dv-dropdown`, `dv-field`, `dv-pagination`,
  `dv-product-card`, `dv-state`, `dv-tabs`, `dv-toast`, `dv-toast-stack`) can split cleanly across
  parallel follow-up tasks with zero file overlap — see `docs/guides/i18n.md`. Not yet done: those
  ~10 components, and a `docs/component-manifest.json` refresh (found stale across TASK-004..008
  during TASK-008's review, pre-existing drift unrelated to i18n specifically).

### P2 — already YAGNI-tagged and correctly parked; don't reopen without a real use case

- Named multi-slot outlets (ADR-0013, explicitly "sketch, not a decision").
- Extending `onError`'s `phase` to lifecycle hooks beyond render/action (ADR-0015 follow-up).
- Form-associated custom elements via `ElementInternals` (low impact today since `dv-field` wraps
  native `<input>`/`<select>`, which already participate in native form submission).

Not a gap: static-asset cache-busting/versioning for self-hosted DevinimJS files is already
solved on the DizgePHP side (`Dizge\Devinim\Renderer`, DizgePHP swarm task TASK-003).
