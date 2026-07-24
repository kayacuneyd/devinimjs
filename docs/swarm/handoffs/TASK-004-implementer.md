# Handoff: TASK-004 — Implementer

## Status

Complete.

## Inputs reviewed

- `docs/swarm/README.md` (non-negotiable rules) and
  `docs/swarm/tasks/TASK-004-data-table-pagination-filtering.md` (full task contract).
- `src/components/dv-data-table.js` (implementation file, mine to edit).
- `src/components/dv-pagination.js` (the black-box API being composed — read only, not modified;
  confirmed its `data-page`/`data-total`/`data-size` attribute contract, one-based paging, and
  that `goTo()`/attribute-driven clamping never re-emits `dv:page` when an attribute write lands
  on the page it's already showing).
- `tests/unit/dv-data-table.test.js` (existing 6-test baseline, extended in place).
- `src/core/base-component.js` (render pipeline, event delegation/ownership rules, `<dv-outlet>`
  exemption, `str/num/bool/json` helpers) and `src/core/morph.js` (DOM diff algorithm) — read
  only, needed to understand why a straightforward composition attempt failed (see below).
- `design/component-library.md` — found and updated the `dv-data-table` contract section (grepped
  for it per the task's instruction).
- `adr/0010-mvp-scope.md` (component scoping precedent) and `adr/0014-keyed-morph.md` (row-list
  rendering stayed unkeyed/positional — no interaction found; rows aren't reordered by identity in
  a way that needed `data-key`, and adding it wasn't in scope).
- `scripts/size-check.mjs` — confirmed the 4 KB gate bundles only `src/core/core.js`; component
  files (including `dv-data-table.js`) are not part of that budget. Reported honestly below rather
  than assuming the gate would move.

## Evidence and findings

**Baseline (before any change):** `npm test` → 144 tests, 144 pass. `npm run size` → core bundle
3352 B min+gzip (budget 4096 B), gate passed.

**Final (after the change), `npm run verify` run twice back-to-back, both fully green:**
- `npm run lint` → clean, no errors/warnings (jsdoc rules included).
- `npm test` → **152 tests, 152 pass, 0 fail** (net +8 in `tests/unit/dv-data-table.test.js`:
  6 → 14; one existing test renamed/re-asserted, see below).
- `npm run test:e2e` → **19/19 passed** (Playwright, real Chromium). Not skipped or downgraded —
  ran to completion both times, ~13–18s.
- `npm run size` → `core bundle: 8368 B min, 3352 B min+gzip (budget 4096 B)` — **unchanged**,
  because the size gate only bundles `src/core/core.js`; `dv-data-table.js` itself isn't measured
  by `npm run size` (confirmed by reading `scripts/size-check.mjs`). The task file's framing ("the
  4 KB gate is real pressure here") doesn't hold for this specific gate as implemented — flagging
  this explicitly rather than silently agreeing with the premise.
- Self-check per the acceptance criteria: `git diff src/components/dv-data-table.js | grep -inE
  "prev|next|ceil|floor.*page|page.*count"` → only two prose-comment hits ("previous page
  number", "outlet itself"), zero hand-rolled prev/next/page-count logic. `<dv-pagination>` is
  composed, not reimplemented.

**A real architectural gap found and worked around (not a src/ change outside my ownership):**
writing `<dv-pagination>` directly inside `dv-data-table`'s `html` template — the obvious,
task-suggested approach — is broken by the current `morph()` in `src/core/morph.js`. `morph()`
only exempts the literal `<dv-outlet>` tag from recursive diffing (ADR-0009); any other nested
custom element that renders its own DOM (like `dv-pagination`'s `<nav>`/buttons) gets diffed
against the *parent's* template text for that tag — which never describes the child's internals,
since the child renders itself independently after connecting — and its content is deleted on the
parent's very next re-render. I reproduced this with a standalone script: mount
`<dv-data-table data-page-size="2">`, click "Next" on the composed pagination, and the
`<dv-pagination>` element ends up completely empty (`<dv-pagination ...></dv-pagination>`, no
`<nav>`) after settling, because `dv-data-table`'s own re-render (triggered by handling the
`dv:page` event) wipes it out immediately after `dv-pagination` finished re-rendering itself. This
reproduces on **every single page click**, 100% of the time, not an edge case.

Since `src/core/morph.js` and `src/components/dv-pagination.js` are both outside this task's file
ownership (morph.js belongs to no one in this round; dv-pagination.js is TASK-005's), I worked
around it without touching either: `dv-data-table.js` now mounts `<dv-pagination>` imperatively
inside a private `<dv-outlet class="dv-data-table-pagination">` placeholder (the one tag
`morph()` never recurses into), created/updated in a new `#syncPagination()` method called from
`connected()` (first mount) and `updated()` (every subsequent sync). Attributes are written in
`size → total → page → label` order so `dv-pagination`'s own clamping always sees fresh
total/size before it processes the page value. `template()` itself only conditionally emits the
empty outlet marker when `pageSize > 0`; the actual `<dv-pagination>` element and its `dv:page`
listener are managed by `#syncPagination()`. `onPage(event)` still exists as the actual state
transition (`this.state.page = event.detail.page`), just invoked from a plain
`addEventListener('dv:page', …)` on the mounted element instead of the `data-on:dv:page`
delegation directive (which never appears in the template string now, so it isn't auto-delegated
by `BaseComponent`).

A regression test (`tests/unit/dv-data-table.test.js`, inside "a positive data-page-size slices…")
explicitly guards against this: it clicks Next, settles, then re-checks that `dv-pagination`'s own
`<nav>`/buttons and `[aria-current="page"]` text are still present and correct — this is exactly
the assertion that failed against the naive declarative-template approach during development, and
now passes.

**Other implementation decisions:**
- Filter: case-insensitive substring match across `this.state.columns` keys (only *visible*
  columns, per the task's "visible column values" wording), recomputed inside `template()` on
  every render (not cached), emits `dv:filter` with `{ query }` for symmetry with `dv:sort`
  (not required by acceptance criteria, but consistent with the framework's event-per-mutation
  convention — e.g. `dv-search` does the same for its own query).
- Sort is now numeric-aware (`compareValues`): compares numerically when both sides parse as
  finite, non-empty numbers; falls back to `localeCompare` otherwise. This was called out in the
  task as "fix if trivial, else leave alone" — it was a ~10-line pure function, so I fixed it and
  renamed/re-asserted the test that previously documented the gap
  (`tests/unit/dv-data-table.test.js:74`, now "a numeric-looking column sorts numerically, not
  lexicographically", asserting `['2', '3', '10']` instead of the old lexicographic order).
- Page resets to 1 on: sort change (required by acceptance criteria), filter change (required),
  and `data-rows` attribute change (not explicitly required, but the same "avoid stranding on an
  empty page" reasoning applies — a live row-set swap can shrink total below the current page just
  as easily as a filter can; added for consistency, low risk, covered indirectly by existing
  regression test 6 which still passes with no `data-page-size` set).
- `data-page-size` absent or `0` → `pageSize = 0` → no pagination, all filtered/sorted rows render,
  no `<dv-outlet>`/`<dv-pagination>` in the DOM at all — verified as two explicit regression tests
  (absent and explicit `"0"`).

## Changed files

- `src/components/dv-data-table.js` — the feature (filter, pagination composition, numeric-aware
  sort, page-reset logic).
- `tests/unit/dv-data-table.test.js` — 6 → 14 tests: one renamed/re-asserted (numeric sort), 8 new
  (filter narrowing, empty-filtered-result, filter+sort composition, page-size absent/`"0"`
  regressions, pagination slicing + `dv-pagination` survival across re-renders, sort-resets-page,
  filter-resets-page).
- `design/component-library.md` — `dv-data-table` section rewritten to document the filter,
  `data-page-size`, `dv:filter`, page-reset behavior, and the numeric-aware sort.
- `CHANGELOG.md` — new entry under `[Unreleased]` → `### Added`.
- `types/components/dv-data-table.d.ts` — regenerated by `npm run build:types` (runs as part of
  `npm test`, per ADR-0017) to reflect the new public methods/state shape; committed since it's a
  tracked generated artifact mechanically derived from this file.
- Committed on `swarm/task-004-data-table-pagination-filtering` (commit `db54eb6`). Not pushed,
  not merged, `docs/swarm/active-work.md` untouched, `docs/roadmap.md` untouched (its P1 gap line
  for this item is the orchestrator's to close, consistent with how TASK-001..003's roadmap
  closure was a separate orchestrator commit).

## Open questions and risks

- **Morph/composition gap is real and will resurface.** Any future component that composes
  another self-rendering custom element declaratively inside its own `template()` (this round's
  TASK-006 `dv-modal` is a plausible candidate if it ever nests something like `dv-confirm`) will
  hit the same bug. The private-outlet-plus-imperative-mount workaround I used is repo-safe (no
  edits outside my ownership) but is a per-component workaround, not a framework fix. Worth an ADR
  and a generalized "opaque subtree" exemption in `morph.js` (e.g. exempt any custom element that
  declares itself self-managing, not just the literal `<dv-outlet>` tag) if this pattern recurs —
  recommend adding this as a roadmap/backlog item.
- **Minor edge case, not covered by a test:** `dv-data-table` now writes a `<dv-outlet
  class="dv-data-table-pagination">` into its own template when paginating. `BaseComponent`'s
  `#placeOutletChildren()` finds the *first* `dv-outlet` anywhere in the rendered output
  (`this.querySelector('dv-outlet')`, no class filter) to place any consumer-supplied light-DOM
  children. `dv-data-table` has never supported light-DOM children (any previously nested content
  was silently dropped with a console warning, unchanged in this task), so today nobody can hit
  this — but *if* a future caller nests markup inside `<dv-data-table>…</dv-data-table>` **and**
  sets `data-page-size > 0`, that content would now be silently absorbed into the pagination
  outlet instead of being dropped-with-a-warning as before. Zero current usage, no test added for
  it (would be testing a hypothetical, not a real regression) — flagging for awareness only.
- **`dv:filter` event:** added for symmetry with `dv:sort`/`dv-search`'s `dv:query`, not required
  by the task's acceptance criteria. If the orchestrator/reviewer would rather keep the public
  event surface minimal, it's a one-line removal (`this.emit('filter', …)` in `onFilter`) with no
  other code depending on it.
- **Size gate scope:** confirmed `npm run size` only measures `src/core/core.js`, not component
  files — so "confirm the size delta" for this task is `0 B` on the gated number by construction,
  not because the added code is free. Flagging in case the orchestrator wants a separate,
  non-gating measurement of `dv-data-table.js` itself for visibility (happy to add one if wanted,
  didn't want to invent a new script outside my file ownership without asking first).
- No `src/core/*.js` or `src/components/dv-pagination.js` file was touched — verified via
  `git diff --stat` (only the 5 files listed above appear).

## Next recipient

Orchestrator.
