# Handoff: TASK-010 — Implementer

## Status

Complete. `npm run verify` (lint + unit + e2e + size) is fully green in this worktree.

## Inputs reviewed

- `docs/swarm/tasks/TASK-010-i18n-wiring-field-state-toast-stack.md` (full task contract).
- `docs/swarm/README.md` (swarm non-negotiable rules).
- `docs/guides/i18n.md` (the how-to, especially §1's config-vs-copy guidance and §6's test
  pattern) — followed step by step.
- `src/components/dv-modal.js` + `dv-modal.locale.js` (reference implementation: bundle shape,
  `registerLocales()`/`connected()`/`onLocaleChange()` wiring, `t()` call-site substitution).
- `src/components/dv-field.js`, `dv-state.js`, `dv-toast-stack.js` (pre-change, in full) and their
  existing tests (`tests/unit/dv-field.test.js`, `dv-state.test.js`, `dv-toast-stack.test.js`,
  `tests/unit/atomic-components.test.js`).
- `src/core/i18n.js` (the `t(el, key, fallback, params)` primitive itself — confirmed `str()`
  does `this.dataset[key]` literal lookup, camelCase-only per spec, same contract `t()` reuses).
- `docs/component-manifest.json` — confirmed it already documents `data-retry-label` (camelCase
  `retryLabel`) as `dv-state`'s intended attribute, which is what led me to the pre-existing bug
  noted below.
- `docs/swarm/handoffs/TASK-008-implementer.md` (precedent for handoff depth/format and for the
  kebab-case dataset-key bug class).

## Evidence and findings

**Wired vs. deliberately left as config, per component** (per task contract + guide §1 —
`en` fallback text is byte-for-byte identical to the pre-existing hardcoded strings in every
case):

- **`dv-field`** — wired: `label` (`'Field'`/`'Alan'`), `error` (`'Please enter a valid
  value.'`/`'Lütfen geçerli bir değer girin.'`). Left on `this.str()`, unchanged: `id`/`name`
  (element identity, not copy), `control` (`'input'`/`'textarea'`/`'select'` — selects which HTML
  element renders), `type` (a literal `input[type]` value), `placeholder` (no fallback text to
  begin with — nothing to wire).
- **`dv-state`** — wired: `loading` (`'Loading…'`/`'Yükleniyor…'`), `error` (`'Something went
  wrong.'`/`'Bir şeyler ters gitti.'`), `retryLabel` (`'Try again'`/`'Tekrar dene'`), `empty`
  (`'Nothing to show yet.'`/`'Henüz gösterilecek bir şey yok.'`). Left on `this.str()`, unchanged:
  `state` (selects which of the three render branches runs, not displayed text).
- **`dv-toast-stack`** — wired: `label` (`'Notifications'`/`'Bildirimler'`, already routed through
  `str()` pre-change), `dismiss` (`'Dismiss'`/`'Kapat'`, previously a literal
  `aria-label="Dismiss"` in the template with no `str()`/`t()` call at all — same situation as
  `dv-modal`'s `close` aria-label before TASK-008).

**One incidental bug fixed while porting `dv-state` (in scope, flagged per the guide's step 4
instruction to check for this while porting):** the pre-existing code called
`this.str('retry-label', 'Try again')` — a literal kebab-case string passed as a `dataset` key.
`HTMLElement.dataset` only exposes camelCase named properties per spec, so
`dataset['retry-label']` is `undefined` in a real browser; `data-retry-label` has therefore never
actually worked as an override in production (same class of bug TASK-008 fixed in
`dv-confirm`/`dv-cart`, and it's the same reason no test ever caught it — happy-dom
non-spec-compliantly accepts both forms). `docs/component-manifest.json` already documented
`data-retry-label` as the intended attribute, confirming this was a bug, not an intentional
kebab-case scheme. Fixed to the correct camelCase key (`retryLabel`) as part of routing the call
through `t()`. This is a fix, not a regression — nothing could have depended on the previously
non-functional override.

**Reference wiring matched exactly:** `registerLocales(tagName, locales)` called once at module
scope in each component file; each component's `connected()` now includes
`this.onCleanup(onLocaleChange(() => this.requestUpdate()))` (added fresh in `dv-field.js` and
`dv-toast-stack.js`, which had no pre-existing `connected()`; appended as a new line in
`dv-state.js`'s new `connected()`, also previously absent). Every `str()` call for a wired key was
replaced 1:1 with `t(this, key, fallback)` — no parameterized (`{placeholder}`) strings in any of
the three components, so no `params` argument was needed anywhere.

**Test counts:**
```
Before (this worktree, clean checkout):
  npm test             → # tests 193  # pass 193
  npx playwright test  → 23 passed
  npm run size         → core bundle: 8368 B min, 3352 B min+gzip (budget 4096 B)  SIZE GATE PASSED

After:
  npm run lint         → clean
  npm test             → # tests 202  # pass 202  # fail 0  # cancelled 0  # skipped 0  # todo 0
  npx playwright test  → 23 passed (16.4s)
  npm run size         → core bundle: 8368 B min, 3352 B min+gzip (budget 4096 B)  SIZE GATE PASSED  (unchanged)
```
`202 - 193 = 9` new unit tests (3 per component, matching guide §6's three required cases —
locale-bundle-used, `data-*`-override-still-wins, unchanged-fallback — for each of `dv-field`,
`dv-state`, `dv-toast-stack`; no parameterized-substitution case needed since none of the three
components' wired keys interpolate a value). E2e count is unchanged (23 → 23) — I did not extend
`examples/i18n.html` or `tests/e2e/i18n.spec.js`, per the guide's explicit "isn't required — the
demo intentionally stays to the three original reference components" note; no `dv-field`/
`dv-state`/`dv-toast-stack` sections were added there.

`npm test` also runs a `build:types` subtest (ADR-0017) that regenerates `.d.ts` declarations —
confirmed the three new `types/components/*.locale.d.ts` files were generated and committed
alongside the source they describe.

**Shared-file discipline:** `tests/unit/atomic-components.test.js` was read but **not modified** —
its `dv-field` (`'field reports value and native validity'`,
`'field renders select options and retains native control semantics'`) and `dv-state`
(`'state emits retry in its error state'`) smoke-test entries don't touch `label`/`error`/
`loading`/`retryLabel`/`empty`, so they continued to pass unchanged against the wired components
without edits (verified: they're part of the 202 passing tests above, and `git diff --stat` shows
this file untouched). `dv-toast-stack` has no entry in that file, matching the task contract. Did
not touch any `dv-pagination`/`dv-data-table`/`dv-autocomplete`/`dv-dropdown`/`dv-product-card`
entries.

## Changed files

All within this worktree, branch `swarm/task-010-i18n-wiring-field-state-toast-stack`, one commit
(`feat(i18n): wire dv-field, dv-state, dv-toast-stack into the i18n primitive (ADR-0019)`):

- `src/components/dv-field.js`, `dv-state.js`, `dv-toast-stack.js` (modified) — wired to `t()`,
  each gained/extended a `connected()` subscribing to `onLocaleChange()`.
- `src/components/dv-field.locale.js`, `dv-state.locale.js`, `dv-toast-stack.locale.js` (new) —
  co-located `en`/`tr` bundles.
- `types/components/dv-field.locale.d.ts`, `dv-state.locale.d.ts`, `dv-toast-stack.locale.d.ts`
  (new, auto-generated by `npm run build:types`, ADR-0017).
- `tests/unit/dv-field.test.js`, `dv-state.test.js`, `dv-toast-stack.test.js` (modified — added
  3 i18n tests each; did not remove or alter any existing test).
- `CHANGELOG.md` (modified — new `[Unreleased]` bullet added above the TASK-008 entry,
  append-only).

Not touched (confirmed via `git diff --stat`): `tests/unit/atomic-components.test.js` (read only,
per the finding above — the shared entries needed no edits), `docs/swarm/active-work.md`,
`docs/roadmap.md`, `docs/component-manifest.json`, `examples/i18n.html`,
`tests/e2e/i18n.spec.js`, `src/core/i18n.js`, `src/core/core.js`, `src/core/base-component.js`,
and every file belonging to `dv-pagination`/`dv-data-table` (TASK-009) or
`dv-autocomplete`/`dv-dropdown`/`dv-tabs`/`dv-product-card`/`dv-toast` (TASK-011).

## Open questions and risks

1. **`tests/unit/atomic-components.test.js` needed zero edits**, contrary to a literal reading of
   the acceptance criteria bullet listing its `dv-field`/`dv-state` entries as "mine to touch." I
   interpreted that bullet as an ownership/non-overlap boundary (which entries I'm allowed to
   edit if needed, and must not let sibling tasks' entries block me on), not a mandate to add new
   assertions there — the guide's §6 pattern places new i18n test cases in each component's own
   test file (mirroring `dv-modal.test.js`, which has its own file), which is what I did for all
   three components. If the orchestrator intended new locale-bundle assertions inside
   `atomic-components.test.js` specifically, that's a quick follow-up, but I judged it redundant
   with the coverage already added in `dv-field.test.js`/`dv-state.test.js`.
2. **`docs/component-manifest.json` already listed `data-retry-label` correctly** (unlike the
   TASK-008 case, where the manifest was silently correct while the code was wrong and the
   manifest itself needed no update) — no manifest changes were needed for this task's bug fix.
3. I did not update `docs/roadmap.md` — per TASK-008's precedent, that appears to be an
   orchestrator action post-integration-review, not an implementer action.
4. No parameterized (`{placeholder}`) strings existed in any of the three components, so guide
   §6's fourth test case (cross-row substitution) doesn't apply here — flagging explicitly so its
   absence isn't mistaken for an oversight.

## Next recipient

Orchestrator.
