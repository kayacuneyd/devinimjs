# Handoff: TASK-011 — Implementer

## Status

Complete

## Inputs reviewed

- `docs/swarm/tasks/TASK-011-i18n-wiring-autocomplete-dropdown-tabs-product-card-toast.md` (task
  contract)
- `docs/guides/i18n.md` (authoritative how-to, §1–§7)
- `adr/0019-i18n-locale-primitive.md` (design rationale)
- `src/core/i18n.js` (the primitive itself: `t`, `registerLocales`, `setLocale`, `getLocale`,
  `onLocaleChange`)
- `src/components/dv-modal.js` + `dv-modal.locale.js` + `tests/unit/dv-modal.test.js` (reference
  implementation and its §6 test pattern)
- `src/components/dv-cart.locale.js`, `dv-confirm.locale.js` (translation-style precedent)
- `src/components/dv-autocomplete.js`, `dv-dropdown.js`, `dv-tabs.js`, `dv-product-card.js`,
  `dv-toast.js` (all five, in full, before touching any of them)
- `tests/unit/dv-autocomplete.test.js`, `dv-dropdown.test.js`, `dv-tabs.test.js`,
  `dv-product-card.test.js`
- `tests/unit/atomic-components.test.js` (shared file; read in full to confirm which entries are
  mine and that they need no changes)

## Evidence and findings

### What was wired

- **`dv-autocomplete`** — `label` (`'Search'`). New `src/components/dv-autocomplete.locale.js`
  (`en.label: 'Search'`, `tr.label: 'Ara'`). `query` was left alone per the task's explicit
  scope note (live search input state, not copy).
- **`dv-dropdown`** — `label` (`'Menu'`). New `src/components/dv-dropdown.locale.js`
  (`en.label: 'Menu'`, `tr.label: 'Menü'`). Component had no `connected()` before; added one
  solely to subscribe to `onLocaleChange()`.
- **`dv-tabs`** — `label` only (`'Tabs'`, the tablist's `aria-label`). New
  `src/components/dv-tabs.locale.js` (`en.label: 'Tabs'`, `tr.label: 'Sekmeler'`). Nothing else
  in this file was touched — no changes to `activateIndex`, `onKeydown`, `onFocusin`,
  `#syncPanels`, `aria-selected`, or any panel wiring. The existing `connected()` (which already
  calls `#syncPanels()`) got one added line to subscribe to locale changes; everything else in
  that method is unchanged.
- **`dv-product-card`** — `action` (`'Add to cart'`). New
  `src/components/dv-product-card.locale.js` (`en.action: 'Add to cart'`,
  `tr.action: 'Sepete ekle'`).

### `dv-product-card`'s `name` — judgment call: NOT wired

`this.str('name', 'Product')` is read once in `initialState()` and become `this.state.name`,
rendered as the card's `<h3>`. I decided **not** to wire it through `t()`, for two reasons:

1. It functions as a generic "missing product data" placeholder, not copy a human is meant to
   read as part of the page's UI chrome (the button label "Add to cart" is chrome; "Product" is
   a degenerate/error-ish default for absent real data, closer in spirit to the `control`/`type`/
   `state` config strings the guide's §1 explicitly says not to wire).
2. Every real usage of `<dv-product-card>` supplies `data-name` (see the smoke test in
   `atomic-components.test.js` and the one dedicated `dv-product-card.test.js` test) — the
   fallback is essentially unreachable in intended usage, unlike `dv-dropdown`'s `label`/
   `dv-tabs`' `label`, which are genuinely displayed as-is in normal, correctly-configured usage.

This is documented in three places: `dv-product-card.locale.js`'s header comment, a comment on
the `DvProductCard` class itself in `dv-product-card.js`, and this handoff. I did **not** force a
wiring just to have a bigger diff.

### `dv-toast` — audited, nothing to wire, no locale file created

Read `dv-toast.js` in full. Its only `str()` call is:

```js
message: this.str('message', '')
```

The fallback is an empty string, not a hardcoded English default — the toast always displays
consumer-supplied text (`show(message)` or `data-message`), so there is no translatable copy to
extract. Confirmed no other `str()`/hardcoded-text call sites exist in the file (`duration` is
`this.num()`, not a string; `data-message`/`data-open` are the only observed attributes).
Per the task's explicit instruction, no `dv-toast.locale.js` was created and `dv-toast.js` is
otherwise untouched.

### `atomic-components.test.js` — no edits needed

The three entries this task owns (`'dropdown toggles its consumer-owned menu'`, `'product card
emits its configured product'`, `'autocomplete filters local items and emits a selected value'`)
already existed, unchanged, and already pass — they exercise default (no-locale, no-override)
rendering, which is byte-identical to before since every `en` bundle value matches the prior
hardcoded fallback exactly. I made **zero** edits to this shared file (confirmed via
`git diff --stat`, `atomic-components.test.js` does not appear). `dv-tabs` and `dv-toast` have no
entries in that file, per the task description.

### Tests added (per guide §6, one 3-test block per wired component in its own test file)

Each of `tests/unit/dv-autocomplete.test.js`, `dv-dropdown.test.js`, `dv-tabs.test.js`,
`dv-product-card.test.js` gained three tests:
1. active `tr` locale bundle renders when no override is set (`setLocale('tr')` +
   `requestUpdate()`, reset via `setLocale(null)` in `finally`)
2. a `data-*` override still wins over the active locale bundle (ADR-0005 regression)
3. the unchanged hardcoded fallback still applies with no locale/override set

No parameterized (`{placeholder}`) strings were introduced by this task, so step 4 of §6 doesn't
apply to any of these four components.

### Test counts

- Before: `npm test` → 193 passing (`node --test tests/unit/*.test.js`, includes the
  `build:types` subtest).
- After: `npm test` → **205 passing**, 0 failing (net +12 = 4 components × 3 new tests each).
- `npx playwright test` (via `npm run test:e2e`): **23 passed**, unchanged from before this task
  (no e2e assertions added — none of these four components appear in `examples/i18n.html`'s
  live-switch demo; per the guide, extending that demo is optional and I judged it not warranted
  for this round, consistent with the demo intentionally staying to the three original reference
  components per the guide's §6 note).

### `npm run size`

```
core bundle: 8368 B min, 3352 B min+gzip (budget 4096 B)
SIZE GATE PASSED
```
Unchanged from the pre-task baseline (3352 B / 4096 B) — expected, since `t`/`registerLocales`/
`onLocaleChange` are imported from `src/core/i18n.js` directly (never re-exported from
`core.js`), exactly like the three reference components.

### `npm run lint`

Clean — `eslint .` produced no output/errors.

### `npm run verify`

Ran the full pipeline (`lint && test && test:e2e && size`) end to end: **all green**. Ran it
twice — once before the CHANGELOG edit, once after staging/committing — both fully green.

## Changed files

- `src/components/dv-autocomplete.js` — import `t`/`registerLocales`/`onLocaleChange`, register
  bundle, add `connected()`, `label` → `t(this, 'label', 'Search')`.
- `src/components/dv-autocomplete.locale.js` (new) — `en`/`tr` bundle, one key (`label`).
- `src/components/dv-dropdown.js` — same pattern; added `connected()` (component had none
  before); `label` → `t(this, 'label', 'Menu')`.
- `src/components/dv-dropdown.locale.js` (new) — `en`/`tr` bundle, one key (`label`).
- `src/components/dv-tabs.js` — same pattern; one line added to the existing `connected()`;
  tablist `aria-label` → `t(this, 'label', 'Tabs')`. Nothing else in the file changed.
- `src/components/dv-tabs.locale.js` (new) — `en`/`tr` bundle, one key (`label`).
- `src/components/dv-product-card.js` — same pattern; added `connected()`; button text →
  `t(this, 'action', 'Add to cart')`; added a class-level comment documenting the `name`
  judgment call; `name` itself is unchanged (`this.str('name', 'Product')`).
- `src/components/dv-product-card.locale.js` (new) — `en`/`tr` bundle, one key (`action`), with a
  header comment explaining why `name` isn't in it.
- `tests/unit/dv-autocomplete.test.js`, `dv-dropdown.test.js`, `dv-tabs.test.js`,
  `dv-product-card.test.js` — added the `setLocale` import and a 3-test i18n block each (§6
  pattern), appended at the end of each file. No existing tests in these files were modified.
- `types/components/dv-autocomplete.locale.d.ts`, `dv-dropdown.locale.d.ts`,
  `dv-tabs.locale.d.ts`, `dv-product-card.locale.d.ts` (new), and
  `types/components/dv-product-card.d.ts` (modified) — auto-generated by the `build:types` step
  that runs as part of `npm test` (ADR-0017); committed as-is, matching existing convention for
  every prior i18n-wiring task.
- `CHANGELOG.md` — one new bullet appended under `[Unreleased]` → `### Added`, directly after
  TASK-008's original i18n-primitive entry, covering exactly what was wired, the `name` judgment
  call, and the `dv-toast` audit conclusion. No other bullets touched.
- `src/components/dv-toast.js` — **not modified**. `tests/unit/dv-toast.test.js` — **not
  touched** (no test file for it existed before this task and none was needed).
- `tests/unit/atomic-components.test.js` — **not modified** (see "Evidence and findings" above
  for why no edit was needed).

Not touched: any `dv-pagination`/`dv-data-table`/`dv-field`/`dv-state`/`dv-toast-stack` files
(TASK-009/TASK-010 territory), `docs/swarm/active-work.md`, `main`.

## Open questions and risks

- **`dv-product-card`'s `name` fallback**: a judgment call, not a hard rule violation either way.
  If the orchestrator or a human reviewer disagrees and wants it wired too, it's a small
  follow-up: add `name: 'Product'` to `dv-product-card.locale.js`'s `en`/`tr`, swap
  `this.str('name', 'Product')` for `t(this, 'name', 'Product')` in `initialState()`, and add one
  more assertion to each of the three new i18n tests in `dv-product-card.test.js`.
- **CHANGELOG merge conflict expected**: per the task file, `CHANGELOG.md` is append-only and
  shared with TASK-009/TASK-010 this round — a routine multi-append conflict at merge time is
  expected and was already flagged as normal in the task contract.
- No `examples/i18n.html` / `tests/e2e/i18n.spec.js` changes were made — optional per the guide,
  and I judged none of these four components essential to that demo's scope this round. Flagging
  in case the orchestrator wants a fourth demo section added later.
- Git commit author identity on this worktree resolved to a generic `root@serverkaya...` (no
  global git user configured in this environment) — same as presumably every other sibling
  worktree this round; not something I changed or was asked to change.

## Next recipient

Orchestrator
