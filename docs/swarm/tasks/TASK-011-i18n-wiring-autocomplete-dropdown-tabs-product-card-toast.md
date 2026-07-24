# Task: TASK-011 — i18n wiring: `dv-autocomplete`, `dv-dropdown`, `dv-tabs`, `dv-product-card`, `dv-toast`

## Goal

Wire `dv-autocomplete`, `dv-dropdown`, `dv-tabs`, `dv-product-card`, and `dv-toast` into the
i18n/locale primitive from ADR-0019 (`src/core/i18n.js`), following `docs/guides/i18n.md` step
by step. Sibling of TASK-009 and TASK-010, opened in the same round — all three touch disjoint
`src/components/*.js`/`*.locale.js` files and run fully in parallel. This task has the most
components but each has the least surface area — expect this to be the fastest of the three
sibling tasks.

## Scope and non-goals

Read `docs/guides/i18n.md` in full before starting — it is the authoritative how-to; this section
only lists what's specific to these five components.

- **`dv-autocomplete`** — wire `label` (`'Search'`) only. (`query`, read via `str('query')` with
  no fallback text, is live search input state, not copy — nothing to wire there.)
- **`dv-dropdown`** — wire `label` (`'Menu'`) only.
- **`dv-tabs`** — wire `label` (`'Tabs'`, the tablist's `aria-label`) only. Be careful here: this
  is the accessibility reference component (ADR-0010) with the deepest ARIA wiring in the
  library — don't touch anything about tab activation, keyboard nav, or panel/`aria-selected`
  logic, only the one static `label` string.
- **`dv-product-card`** — wire `action` (`'Add to cart'`). `name`'s `'Product'` fallback
  (`this.str('name', 'Product')`) is a **borderline case, your judgment call**: it's the initial
  state read once via `initialState()`, functioning more as a generic placeholder default for
  missing product data than as UI chrome copy in the same sense as the others. If you wire it,
  document why in the handoff; if you decide it's not worth wiring (config-adjacent, low value),
  say so and move on rather than forcing it.
- **`dv-toast`** — **audit only, may turn out to be nothing to wire.** Its one `str()` call is
  `message` with an empty-string fallback (`this.str('message', '')`) — the toast always displays
  consumer-supplied text, there is no hardcoded English default to translate. Confirm this by
  reading the file; if there's genuinely no translatable copy, say so explicitly in the handoff
  (don't invent something to wire just to have a diff) and skip creating a `dv-toast.locale.js`.

Out of scope: any component other than these five. `dv-pagination`/`dv-data-table` (TASK-009) and
`dv-field`/`dv-state`/`dv-toast-stack` (TASK-010) are owned by sibling tasks running in parallel —
don't touch their files.

## Acceptance criteria

Per `docs/guides/i18n.md` §6, for each component you actually wire: a test proving the locale
bundle entry is used when active, a test proving a `data-*` override still wins (ADR-0005
regression), and a test proving the unchanged fallback still applies with no locale/override set.

- `npm test` and `npx playwright test` pass.
- `npm run lint` clean.
- `npm run size` unchanged (3352 B/4096 B) — confirm explicitly.
- `en` bundle values are byte-for-byte identical to today's hardcoded defaults, for every
  component you wire.
- `tr` bundle provided for every wired key.
- `atomic-components.test.js` has smoke-test entries touching `dv-dropdown` (`'dropdown toggles
  its consumer-owned menu'`), `dv-product-card` (`'product card emits its configured product'`),
  and `dv-autocomplete` (`'autocomplete filters local items and emits a selected value'`) — **this
  file is shared across all three parallel i18n-wiring tasks this round.** Edit only your
  components' entries; do not touch `dv-pagination`/`dv-data-table`/`dv-field`/`dv-state`'s
  entries (same append-only-your-own-region discipline as `CHANGELOG.md`). `dv-tabs` and
  `dv-toast` have no entries in that shared file.
- CHANGELOG entry under `[Unreleased]` (append-only, shared with the sibling tasks — expect a
  routine multi-append conflict at merge time, same as every previous round). Include an honest
  note about `dv-toast` if you conclude there's nothing to wire.

## Inputs

- `docs/guides/i18n.md` (the how-to), `adr/0019-i18n-locale-primitive.md` (the design), one of
  `src/components/dv-modal.js` / `dv-confirm.js` / `dv-cart.js` + its `*.locale.js` (the reference
  implementations).
- `src/components/dv-autocomplete.js`, `dv-dropdown.js`, `dv-tabs.js`, `dv-product-card.js`,
  `dv-toast.js`, their current test files, and `dv-dropdown`/`dv-product-card`/`dv-autocomplete`'s
  entries in `tests/unit/atomic-components.test.js`.

## Roles and outputs

| Role | Owner | Output file | Depends on |
| --- | --- | --- | --- |
| Orchestrator | claude (this session) | `docs/swarm/tasks/TASK-011-i18n-wiring-autocomplete-dropdown-tabs-product-card-toast.md` | — |
| Implementer | dispatched agent (isolated worktree) | `docs/swarm/handoffs/TASK-011-implementer.md` | — |

## Exclusive file ownership

| Path or glob | Sole writer | Branch/worktree |
| --- | --- | --- |
| `src/components/dv-autocomplete.js`, `dv-autocomplete.locale.js` (new), `dv-dropdown.js`, `dv-dropdown.locale.js` (new), `dv-tabs.js`, `dv-tabs.locale.js` (new), `dv-product-card.js`, `dv-product-card.locale.js` (new), `dv-toast.js` (audit; new locale file only if warranted) | TASK-011 implementer | isolated worktree, branch `swarm/task-011-i18n-wiring-autocomplete-dropdown-tabs-product-card-toast` |
| `tests/unit/dv-autocomplete.test.js`, `dv-dropdown.test.js`, `dv-tabs.test.js`, `dv-product-card.test.js`, `dv-toast.test.js` | TASK-011 implementer | same |
| `tests/unit/atomic-components.test.js` — **only the `dv-dropdown`, `dv-product-card`, `dv-autocomplete` test entries** | TASK-011 implementer | same, shared file, edit only your own components' entries |
| `CHANGELOG.md` (append-only) | shared append-only across TASK-009/010/011, reconciled at merge | same |

No overlap with TASK-009's or TASK-010's component files.

## Gates

- [ ] Implementation verified (`npm run verify` green in the task's worktree)
- [ ] Handoff written with evidence and open questions (`docs/swarm/handoffs/TASK-011-implementer.md`)
- [ ] Orchestrator integration review complete
- [ ] Human merge approval received
