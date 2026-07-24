# Handoff: TASK-008 — Implementer

## Status

Complete. `npm run verify` (lint + unit + e2e + size) is fully green in this worktree.

## Inputs reviewed

- `docs/swarm/tasks/TASK-008-i18n-primitive-reference-wiring.md` (full task contract).
- `docs/swarm/README.md` (swarm non-negotiable rules).
- `src/core/base-component.js` (the `str`/`num`/`bool`/`json` coercion-helper pattern this
  primitive extends conceptually; confirmed `str(key, fallback)` does `this.dataset[key]` —
  camelCase only, per spec).
- `src/core/transition.js` and `adr/0018-transition-primitives.md` (TASK-007's precedent for a
  primitive kept outside the size-gated core barrel — both the exclusion mechanism and the ADR
  format/tone I matched).
- `src/core/core.js` (confirmed export barrel; `scripts/size-check.mjs` — confirmed `npm run
  size` only bundles/gzips `src/core/core.js` via esbuild, so anything it doesn't export is
  structurally invisible to the gate).
- `src/components/dv-modal.js`, `dv-confirm.js`, `dv-cart.js` (pre-change, in full) and their
  existing tests (`tests/unit/dv-modal.test.js`, `dv-confirm.test.js`,
  `tests/unit/atomic-components.test.js` — confirmed the real `dv-cart`/`dv-confirm` component
  smoke tests live in `atomic-components.test.js`, not a `cart.test.js`, which is actually the
  `src/stores/cart.js` store's own test file).
- `adr/0005-attribute-state-contract.md` (the `data-*` override contract I must not break) and
  `adr/0010-mvp-scope.md` (YAGNI/budget culture).
- `site/en/index.html` vs `site/tr/index.html` (confirmed `<html lang="en">`/`<html lang="tr">` —
  the `en`/`tr` convention this primitive's default locale resolution matches).
- `docs/guides/php-integration.md` (guide format/tone reference for the new `docs/guides/i18n.md`).
- `playwright.config.mjs` and `tests/e2e/transitions.spec.js` (e2e conventions for the new
  `tests/e2e/i18n.spec.js`).

## Evidence and findings

**Primitive API and reasoning (ADR-0019 has the full writeup):** `t(el, key, fallback, params)`
in `src/core/i18n.js`, plus `registerLocales(tagName, { en, tr })`, `setLocale(locale | null)`,
`getLocale()`, `onLocaleChange(listener)`. Three-tier resolution: `el.dataset[key]` (identical
lookup to `BaseComponent#str()`, so ADR-0005 is unchanged) > the active locale's registered
bundle entry for that tag > `fallback`. Active locale = `setLocale()`'s override, else
`document.documentElement.lang`, else `'en'`, read fresh on every call (nothing cached).
`{placeholder}` tokens are substituted via one `String.replace` + regex — both bundle entries and
`data-*` overrides support them, so a translator (or a consumer's own override) controls word
order, not just a spliced-in value. `setLocale()` synchronously notifies `onLocaleChange()`
subscribers; all three reference components subscribe once in `connected()`
(`this.onCleanup(onLocaleChange(() => this.requestUpdate()))`), reusing the existing
`requestUpdate()` "external data source" escape hatch rather than inventing a second re-render
mechanism. A bare `document.documentElement.lang` mutation does **not** auto-trigger a re-render
(no `MutationObserver` — deliberate YAGNI, documented in the guide) — a consumer flipping `lang`
directly must also call `setLocale()` or otherwise re-render.

**Locale bundles are co-located, one sibling file per component**
(`src/components/dv-modal.locale.js`, `dv-confirm.locale.js`, `dv-cart.locale.js`, each
`export default { en: {...}, tr: {...} }`), never a shared/centralized file — chosen specifically
so a future one-component wiring task touches only that component's own `.js` + new sibling
`.locale.js`, never another component's files (this was an explicit hard requirement in the task
contract).

**Size-budget decision — standalone module, NOT a `BaseComponent` method — with real measured
numbers for both options (also in ADR-0019):**

```
Baseline (before this task):                                    8368 B min, 3352 B min+gzip
Chosen — standalone src/core/i18n.js, not re-exported by core.js: 8368 B min, 3352 B min+gzip  (Δ +0 B)
Rejected — in-budget BaseComponent#t() + exported registerLocales/
  setLocale/onLocaleChange from core.js:                          8849 B min, 3539 B min+gzip  (Δ +187 B, 557 B headroom left)
```

I measured the in-budget option for real (not estimated): temporarily added an equivalent `t()`
method plus `registerLocales`/`setLocale`/`onLocaleChange` to `src/core/base-component.js`, added
the matching re-exports to `src/core/core.js`, ran `npm run size`, recorded `8849 B / 3539 B`,
then fully reverted both files (verified back to the unchanged baseline `8368 B / 3352 B` before
proceeding — `git diff --stat` showed zero diff on `base-component.js`/`core.js` after the
revert). The in-budget design *does* technically fit under the 4096 B gate, but it's a permanent
tax on every `core.js` consumer (including the ~10 components that won't get i18n even after the
next round) for ergonomics alone (`this.t(...)` vs `t(this, ...)`), and it would have consumed
75% of ADR-0018's carefully-preserved remaining headroom. Chose the standalone module, mirroring
ADR-0018's `awaitTransition` exclusion pattern exactly — verified in the final tree (`dv-modal.js`
etc. import `../core/i18n.js` directly, never through `core.js`'s barrel) that `npm run size` is
unchanged at `3352 B min+gzip`.

**Two incidental bugs fixed while wiring (in scope — full detail and rationale in ADR-0019):**
1. `dv-confirm.js`/`dv-cart.js` previously called `this.str('confirm-label', 'Confirm')`,
   `this.str('cancel-label', 'Cancel')`, `this.str('remove-label', 'Remove')`,
   `this.str('total-label', 'Total')` — literal kebab-case strings passed as `dataset` keys.
   `HTMLElement.dataset` only exposes camelCase named properties per spec, so
   `dataset['confirm-label']` is `undefined` in a real browser; these `data-*` overrides have
   never worked in production. (happy-dom, the unit-test DOM shim, non-spec-compliantly accepts
   both forms — confirmed directly with a `node -e` repro against `happy-dom` — which is why no
   test ever caught this; grepped the whole repo for `data-confirm-label`/`data-remove-label`/etc.
   and found zero references anywhere, including tests, examples, and
   `docs/component-manifest.json`'s attribute list, which lists the *correct* kebab-case HTML
   attribute name — the bug was purely in the JS-side lookup key.) Fixed to the correct camelCase
   keys (`confirmLabel`, `cancelLabel`, `removeLabel`, `totalLabel`) as part of routing these
   through `t()`, per ADR-0005's own contract. This is a fix, not a regression — nothing could
   have depended on the previously-broken override.
2. `dv-confirm`'s pending-state group `aria-label` previously reused the *same* `label` key as
   the initial button text (`str('label', 'Confirm action')` vs. `str('label', 'Delete')` — same
   dataset key, two different call-site fallbacks) — an incidental coupling where one
   `data-label` override would silently drive two different UI strings. Untested, undocumented.
   Split into its own key (`confirmingLabel`, new `data-confirming-label` override lever) —
   judgment call, flagged prominently in ADR-0019's Consequences and below.

**Reference wiring, one-line summary per component (all `en` fallback text is byte-for-byte
identical to the pre-existing hardcoded strings):**
- `dv-modal`: `label` (`'Dialog'`/`'Pencere'`), `close` (`'Close'`/`'Kapat'` — the close button's
  `aria-label` was previously hardcoded directly in the template, not routed through `str()` at
  all; it now goes through the full three-tier resolution with a new `data-close` override).
- `dv-confirm`: `label` (`'Delete'`/`'Sil'`), `confirmingLabel` (`'Confirm action'`/`'İşlemi
  onayla'`, new/split key — see bug #2 above), `message` (`'Are you sure?'`/`'Emin misiniz?'`),
  `confirmLabel` (`'Confirm'`/`'Onayla'`), `cancelLabel` (`'Cancel'`/`'Vazgeç'`).
- `dv-cart`: `empty` (`'Your cart is empty.'`/`'Sepetiniz boş.'`), `label` (`'Cart'`/`'Sepet'`),
  `removeLabel` (`'Remove'`/`'Kaldır'`), `totalLabel` (`'Total'`/`'Toplam'`), plus three
  parameterized keys previously fully hardcoded template literals with no `str()` call at all:
  `decreaseLabel` (`'Decrease {name}'`/`'{name} azalt'`), `increaseLabel` (`'Increase
  {name}'`/`'{name} artır'`), `quantityLabel` (`'{name} quantity'`/`'{name} adedi'`).

**New example and e2e coverage:** `examples/i18n.html` — an `en`/`tr` toggle driving all three
components live, backed only by `setLocale()` + keeping `<html lang>` in sync (the components
re-render themselves via their own `onLocaleChange()` subscription, no manual DOM patching in the
example script). `tests/e2e/i18n.spec.js` — two Playwright specs: a full round-trip locale switch
(en → tr → en) across all three components including two distinct cart rows (proves parameterized
substitution doesn't cross-contaminate between rows, in a real browser, not just happy-dom), and a
regression spec proving a `data-*` override still wins after a locale switch.

**Config-vs-copy survey for the follow-up round (~10 remaining components), starting point only —
not exhaustive, not verified as deeply as the three components actually wired:**
- Likely real copy (translate): `dv-toast`'s message content (consumer-supplied via `show()`, so
  probably N/A for a bundle, but its dismiss-button `aria-label` if any is hardcoded is a
  candidate — I did not open this file); `dv-pagination`'s any page-label text if present;
  `dv-product-card`'s any static button/label text; `dv-tabs`' any static aria-labels.
- **Confirmed config, not copy — do not wire (from the task contract's own survey, repeated here
  for convenience):** `dv-field`'s `control` (`'input'`/`'textarea'`/`'select'`) and `type` (an
  HTML `input[type]` value); `dv-state`'s `state` (`'empty'`/`'loading'`/`'error'`) — selects a
  render branch, isn't displayed text.
- I did **not** open `dv-autocomplete.js`, `dv-data-table.js`, `dv-dropdown.js`,
  `dv-pagination.js`, `dv-product-card.js`, `dv-tabs.js`, `dv-toast.js`, `dv-toast-stack.js` for
  this survey — out of this task's scope per the non-goals, and I didn't want to guess at their
  `str()` call sites' intent without reading each one properly. The next round's implementer(s)
  should do their own quick read-through per component before wiring, using `docs/guides/i18n.md`
  step 1's config-vs-copy checklist.

**Test counts:**
```
Before (baseline, confirmed by running on a clean checkout of this worktree before any edit):
  npm test    → 174 pass
  npx playwright test → 21 pass
  npm run size → core bundle: 8368 B min, 3352 B min+gzip (budget 4096 B)  SIZE GATE PASSED

After:
  npm run lint    → clean
  npm test        → # tests 193  # pass 193  # fail 0  # cancelled 0  # skipped 0  # todo 0
  npx playwright test → 23 passed (14.2s)
  npm run size    → core bundle: 8368 B min, 3352 B min+gzip (budget 4096 B)  SIZE GATE PASSED  (unchanged)
```
New: `tests/unit/i18n.test.js` (11 tests, the primitive in isolation — three-tier resolution,
locale switching, substitution, cross-contamination, subscribe/unsubscribe), 3 new tests in
`tests/unit/dv-modal.test.js`, 2 new in `tests/unit/dv-confirm.test.js`, 3 new in
`tests/unit/atomic-components.test.js` (cart section — including the required two-row
non-cross-contamination case), 2 new e2e specs in `tests/e2e/i18n.spec.js`. `193 - 174 = 19` new
unit tests; `23 - 21 = 2` new e2e tests — both match what was actually added (no test file was
accidentally overwritten or removed).

`npm test` also runs a `build:types` subtest (ADR-0017) that regenerates `.d.ts` declarations —
confirmed the new `types/core/i18n.d.ts` and three `types/components/*.locale.d.ts` files were
generated and committed alongside the source they describe.

## Changed files

All within this worktree, branch `swarm/task-008-i18n-primitive-reference-wiring`, one commit
(`feat(i18n): locale primitive for translatable component copy (dv-modal/dv-confirm/dv-cart)`):

- `src/core/i18n.js` (new) — the primitive.
- `src/components/dv-modal.js`, `dv-confirm.js`, `dv-cart.js` (modified) — wired to `t()`.
- `src/components/dv-modal.locale.js`, `dv-confirm.locale.js`, `dv-cart.locale.js` (new) —
  co-located `en`/`tr` bundles.
- `types/core/i18n.d.ts`, `types/components/dv-modal.locale.d.ts`,
  `types/components/dv-confirm.locale.d.ts`, `types/components/dv-cart.locale.d.ts` (new,
  auto-generated by `npm run build:types`, ADR-0017).
- `tests/unit/i18n.test.js` (new); `tests/unit/dv-modal.test.js`, `dv-confirm.test.js`,
  `atomic-components.test.js` (modified — added i18n coverage, did not remove or alter any
  existing test).
- `examples/i18n.html` (new) — did not touch any existing example fixture.
- `tests/e2e/i18n.spec.js` (new).
- `adr/0019-i18n-locale-primitive.md` (new), `adr/INDEX.md` (modified — registered + dependency
  graph line).
- `docs/guides/i18n.md` (new).
- `CHANGELOG.md` (modified — new `[Unreleased]` entry, added above the TASK-007 entry).

Not touched (confirmed): `src/core/base-component.js`, `src/core/core.js` (both reverted to
byte-identical originals after the in-budget size experiment —
`git diff main -- src/core/base-component.js src/core/core.js` from this branch shows zero
diff), any component other than the three named, `docs/roadmap.md`,
`docs/swarm/active-work.md`, `site/en/`, `site/tr/`, `docs/component-manifest.json`, any existing
example fixture.

## Open questions and risks

1. **`dv-confirm`'s `confirmingLabel` split (bug #2 above) is the one place I exercised judgment
   beyond a literal port of existing strings.** Before this task, setting `data-label` silently
   changed both the button text and the pending-state `aria-label`. I judged this an untested,
   undocumented, likely-incidental coupling (not a deliberate design) and gave the aria-label its
   own key/override lever instead of carrying the coupling into the bundle system. If any real
   consumer *did* rely on the old coupling (I found no test or doc evidence either way), they'd
   need to also set the new `data-confirming-label` going forward. Flagged for the orchestrator's
   review — this is the one decision in this task that isn't purely mechanical.
2. **`docs/component-manifest.json` is now slightly stale** — it lists `dv-modal`'s attributes as
   `data-label` only (no `data-close`), and doesn't mention `dv-confirm`'s new
   `data-confirming-label` or `dv-cart`'s new `data-decrease-label`/`data-increase-label`/
   `data-quantity-label`. I deliberately did not touch this file — it isn't in this task's file
   ownership table, and no other task is running concurrently this round to coordinate with, so I
   erred toward not touching a path I wasn't explicitly assigned. Worth a follow-up (either a
   small dedicated task, or folded into whichever task next touches that manifest).
3. **The `Set<listener>` in `onLocaleChange()` is an unbounded module-level singleton** for the
   lifetime of the page — each connected component instance adds one listener in `connected()`
   and removes it via `onCleanup()` on disconnect, so this is bounded by currently-mounted
   instances, not a leak, but it's worth the next implementer knowing the pattern (subscribe in
   `connected()`, always pair with `this.onCleanup(...)`) rather than reinventing it per
   component.
4. **Follow-up round scope**: the config-vs-copy survey above is intentionally partial (I did not
   open 8 of the 10 remaining component files) — the next round's implementer(s) should budget
   time for a first-pass read of each component before wiring, not assume the task-contract's
   survey is exhaustive.
5. I did not update `docs/roadmap.md` to mark this P1 gap closed — per the TASK-007 precedent,
   that commit appears to be made by the orchestrator after integration review, not the
   implementer.

## Next recipient

Orchestrator.
