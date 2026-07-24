# Handoff: TASK-009 — Implementer

## Status

Complete. `npm run verify` (lint + unit + e2e + size) is fully green in this worktree.

## Inputs reviewed

- `docs/swarm/tasks/TASK-009-i18n-wiring-pagination-data-table.md` (full task contract).
- `docs/guides/i18n.md` (the authoritative how-to, written by TASK-008 for exactly this kind of
  follow-up task).
- `adr/0019-i18n-locale-primitive.md` (the design, including the reference wiring and the two
  kebab-case-dataset-key bugs it already fixed for `dv-confirm`/`dv-cart`).
- `docs/swarm/README.md` (swarm non-negotiable rules).
- `src/components/dv-cart.js` + `dv-cart.locale.js` in full — the closest precedent for
  parameterized strings, since `dv-pagination`'s page-number and jump aria-labels needed the same
  `{placeholder}` treatment as `dv-cart`'s `decreaseLabel`/`increaseLabel`/`quantityLabel`.
- `src/core/i18n.js` in full — confirmed `t(el, key, fallback, params)` does `el.dataset[key]`,
  the identical camelCase-only lookup `BaseComponent#str()` already uses (ADR-0005), before
  touching either component's `str()` call sites.
- `src/components/dv-pagination.js`, `dv-data-table.js` (pre-change, in full) and their existing
  tests (`tests/unit/dv-pagination.test.js`, `tests/unit/dv-data-table.test.js`,
  `tests/unit/atomic-components.test.js`'s `dv-data-table` entry).
- `tests/unit/dv-modal.test.js`'s `ADR-0019` section (the test-shape to mirror per the guide's
  §6) and `tests/unit/atomic-components.test.js`'s `dv-cart` locale tests (the
  parameterized/no-cross-contamination test pattern).
- `src/core/base-component.js` — confirmed `#notify()`/`requestUpdate()` scheduling
  (`queueMicrotask`, one render per microtask, FIFO across components) before writing the
  parent→child locale-forwarding composition test, to be sure the ordering claim in
  `dv-data-table.js`'s new `connected()` doc comment is actually true and not just plausible.

## Evidence and findings

**`dv-pagination` — more hardcoded-English surface than any component wired so far.** Two
call sites were already routed through `str()` (`label` → `'Pagination'`, `jumpLabel` → `'Jump to
page'`) and ported to `t()` unchanged. Seven more were fully hardcoded template literals with no
`str()` call at all, added in TASK-005 before the primitive existed — all now routed through
`t()`, each with its own bundle key:

- `previousLabel` (`'Previous'`) / `nextLabel` (`'Next'`) — the Previous/Next button *text*.
- `previousPageLabel` (`'Previous page'`) / `nextPageLabel` (`'Next page'`) — their aria-labels
  (kept as separate keys from the button text, since a translator may want different word order
  or phrasing between visible text and the accessible name — same one-key-one-meaning principle
  ADR-0019 applied when it split `dv-confirm`'s `confirmingLabel` out of `label`).
- `pageLabel` (`'Page {page}'`, parameterized) — each page-number button's aria-label. Verified
  substitution doesn't cross-contaminate across buttons (`tests/unit/dv-pagination.test.js`,
  the 7-button truncated-window case: `1`, `8`, `9`, `10`, `11`, `12`, `20`, each resolving to its
  own `'{N}. sayfa'` under `tr`, not a repeated/shared value).
- `jumpAriaLabel` (`'Jump to page, 1 to {pages}'`, parameterized) — the jump-input's aria-label.
- `goLabel` (`'Go'`) — the jump form's submit button text.

The visible `"Page X of Y"` status text (`.dv-pagination-status`) was deliberately **not** wired —
not listed in the task's scope section, and existing tests assert its exact English text as a
behavioral/status signal, not decorative copy; wiring it wasn't asked for and would have been
scope creep.

**`dv-data-table`** — `filterLabel` (`'Filter'`), `label` (`'Data table'`), `paginationLabel`
(`'Pagination'`, forwarded to the composed `<dv-pagination>`) all ported from `str()` to `t()`.

**Bug fix, in scope (same pattern as ADR-0019's `dv-confirm`/`dv-cart` fixes):** the pre-existing
code called `this.str('filter-label', 'Filter')` and `this.str('pagination-label', 'Pagination')`
— literal kebab-case strings passed as `dataset` keys. `HTMLElement.dataset` only exposes
camelCase named properties per spec, so `data-filter-label`/`data-pagination-label` never actually
worked as overrides in production (confirmed no test, example, or
`docs/component-manifest.json` reference to either kebab-case attribute anywhere in the repo).
Fixed to the correct camelCase keys (`filterLabel`, `paginationLabel`) as part of routing through
`t()` — a fix, not a regression, since nothing could have depended on the previously-broken
override. `dv-pagination`'s two pre-existing `str()` calls (`label`, `jumpLabel`) were already
camelCase and had no such bug.

**Composition (the reason these two are one task, not two):** `dv-data-table` resolves its own
`paginationLabel` via `t()`, then forwards the *resolved* string as the composed
`<dv-pagination>`'s `data-label` attribute — that child's own top-priority tier (ADR-0005). No new
design was needed; I added one explicit test proving the forwarding chain resolves correctly
end to end under a non-English active locale
(`tests/unit/dv-data-table.test.js`: `'the forwarded pagination-label reaches the composed
<dv-pagination> correctly under a non-English active locale'`), plus a second test proving an
explicit `data-pagination-label` override on `<dv-data-table>` itself still wins all the way
through the forwarding chain (ADR-0005 regression, composition-specific).

I traced the actual microtask ordering rather than assuming it works (see the doc comment on
`dv-data-table.js`'s `connected()`): `dv-data-table` registers its `onLocaleChange` listener
*before* `#syncPagination()` creates the child `<dv-pagination>` (which registers its own listener
during the same synchronous `appendChild()` call). On `setLocale()`, listeners fire synchronously
in registration order, so `dv-data-table`'s `requestUpdate()` is queued (and its microtask runs)
before `dv-pagination`'s own — meaning `dv-data-table`'s `updated()` → `#syncPagination()` has
already written the freshly-resolved `data-label` attribute onto the child by the time the child's
own locale-triggered re-render reads it. This ordering is structural (child is always created
inside the parent's `connected()`, after the parent's own listener registration), not
coincidental, but it's the one place in this task that needed actual reasoning rather than
mechanical porting — flagged here for the orchestrator's review.

**Test counts:**

```
Before (this worktree, clean checkout, before any edit — confirmed via git stash):
  npm test → # tests 193  # pass 193  # fail 0

After:
  npm run lint         → clean
  npm test              → # tests 202  # pass 202  # fail 0  # cancelled 0  # skipped 0  # todo 0
  npx playwright test   → 23 passed (15.0s–16.3s across runs)
  npm run size           → core bundle: 8368 B min, 3352 B min+gzip (budget 4096 B)  SIZE GATE PASSED (unchanged)
```

`202 - 193 = 9` new unit tests: 4 in `tests/unit/dv-pagination.test.js` (locale-bundle-drives-copy,
data-label-override-wins regression, setLocale-live-switch, parameterized-no-cross-contamination)
+ 5 in `tests/unit/dv-data-table.test.js` (locale-bundle-drives-filter/caption,
filter-label/label-override-wins regression, setLocale-live-switch, the required
pagination-label-forwarding test, and the pagination-label-override-forwards regression). No
existing test was altered or removed. `tests/unit/atomic-components.test.js` was left completely
untouched — its one `dv-data-table` entry (`'data table sorts rows and emits its ordering'`)
doesn't reference any of the strings this task wired, so it needed no edit; I verified it still
passes as part of the full suite run rather than assuming so.

`npm test` also runs a `build:types` subtest (ADR-0017) that regenerates `.d.ts` declarations —
ran `npm run build:types` separately too and confirmed the two new
`types/components/*.locale.d.ts` files were generated and match the existing
`dv-cart.locale.d.ts`/etc. shape; the pre-existing `dv-pagination.d.ts`/`dv-data-table.d.ts`
declaration files came back byte-identical (no diff), since only template/`connected()` bodies
changed, not public method signatures.

## Changed files

All within this worktree, branch `swarm/task-009-i18n-wiring-pagination-data-table`, one commit
(`feat(i18n): wire dv-pagination and dv-data-table into the locale primitive (TASK-009)`):

- `src/components/dv-pagination.js` (modified) — wired to `t()`, added `connected()` for the
  `onLocaleChange` subscription.
- `src/components/dv-data-table.js` (modified) — wired to `t()`, added the `onLocaleChange`
  subscription to the existing `connected()` (ordered before `#syncPagination()`, see above).
- `src/components/dv-pagination.locale.js`, `dv-data-table.locale.js` (new) — co-located `en`/`tr`
  bundles.
- `types/components/dv-pagination.locale.d.ts`, `dv-data-table.locale.d.ts` (new, auto-generated
  by `npm run build:types`, ADR-0017).
- `tests/unit/dv-pagination.test.js`, `dv-data-table.test.js` (modified — added i18n coverage
  only, did not remove or alter any existing test).
- `CHANGELOG.md` (modified — new bullet appended under `[Unreleased]` → `### Added`, directly
  after TASK-008's i18n entry; did not touch any other entry).

Not touched (confirmed via `git status`/`git diff`): `tests/unit/atomic-components.test.js` (no
edit needed, see above), `src/core/i18n.js`, `src/core/core.js`, `src/core/base-component.js`,
any component other than the two named (`dv-field`, `dv-state`, `dv-toast-stack`,
`dv-autocomplete`, `dv-dropdown`, `dv-tabs`, `dv-product-card`, `dv-toast` — TASK-010/TASK-011's
files), `docs/roadmap.md`, `docs/swarm/active-work.md`, `docs/component-manifest.json`,
`examples/i18n.html`, `tests/e2e/i18n.spec.js`.

## Open questions and risks

1. **`docs/component-manifest.json` is now slightly stale**, same situation TASK-008 flagged for
   `dv-modal`/`dv-confirm`/`dv-cart`: it lists `dv-pagination`'s attributes as `["data-page",
   "data-total", "data-size", "data-label"]` (missing the eight new override levers —
   `data-jump-label`, `data-previous-label`, `data-next-label`, `data-previous-page-label`,
   `data-next-page-label`, `data-page-label`, `data-jump-aria-label`, `data-go-label`) and
   `dv-data-table`'s as `["data-columns", "data-rows", "data-label"]` (missing
   `data-filter-label`, `data-pagination-label`). I deliberately did not touch this file — not in
   this task's file ownership table, and TASK-010/TASK-011 are touching the same file
   concurrently for their own components, so editing it here risks a merge collision outside my
   assigned scope. Worth a follow-up task once all three parallel rounds land.
2. **The parent→child locale-forwarding ordering (composition section above) is correct but
   relies on registration order, not an explicit contract.** It works today because
   `dv-data-table.js`'s `connected()` registers its own `onLocaleChange` listener before creating
   the child `<dv-pagination>`. If a future refactor reordered those two lines, the forwarding
   test I added (`'the forwarded pagination-label reaches the composed <dv-pagination> correctly
   under a non-English active locale'`) would catch the regression, but the *reason* it would
   break wouldn't be obvious from the failure alone — I left an explicit doc comment on
   `connected()` for this reason, but flagging here too in case a future ADR wants to make the
   ordering guarantee more formal (e.g. an explicit "flush parent before children" note in
   ADR-0019 or the i18n guide) rather than relying on one component's doc comment.
3. **Naming judgment call:** the task description suggested "`{page}` or similar" for the
   page-number aria-label parameter; I used `pageLabel`/`{page}` exactly as suggested. For the two
   new Previous/Next aria-label keys I chose `previousPageLabel`/`nextPageLabel` (distinct from
   the button-text keys `previousLabel`/`nextLabel`) rather than reusing one key for both button
   text and aria-label — matching ADR-0019's own precedent of giving text and aria-label
   independent keys (`dv-confirm`'s `confirmingLabel` split) rather than coupling them. Flagging
   as a naming judgment call, not a mechanical requirement from the task file.
4. Did not update `docs/roadmap.md` — per TASK-007/TASK-008 precedent, that's an
   orchestrator-after-integration-review step, not an implementer step.

## Next recipient

Orchestrator.
