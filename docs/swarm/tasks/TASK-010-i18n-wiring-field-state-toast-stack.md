# Task: TASK-010 — i18n wiring: `dv-field`, `dv-state`, `dv-toast-stack`

## Goal

Wire `dv-field`, `dv-state`, and `dv-toast-stack` into the i18n/locale primitive from ADR-0019
(`src/core/i18n.js`), following `docs/guides/i18n.md` step by step. Sibling of TASK-009 and
TASK-011, opened in the same round — all three touch disjoint `src/components/*.js`/`*.locale.js`
files and run fully in parallel.

## Scope and non-goals

Read `docs/guides/i18n.md` in full before starting, **especially §1** — this task's components
have the sharpest config-vs-copy traps in the whole remaining set:

**`dv-field`** — wire `label` (`'Field'`) and `error` (`'Please enter a valid value.'`) only.
**Do not** wire `id`/`name` (element identity, not copy), `control` (`'input'`/`'textarea'`/
`'select'` — selects which HTML element to render), `type` (a literal HTML `input[type]` value),
or `placeholder` (has no fallback text to begin with — nothing to wire). Getting `control`/`type`
wrong here would mean a `tr` bundle could "translate" `'input'` into some other string and
silently break which HTML element the component renders — this is the exact trap
`docs/guides/i18n.md` §1 warns about, using this component as its own example.

**`dv-state`** — wire `loading` (`'Loading…'`), `error` (`'Something went wrong.'`),
`retry-label` (`'Try again'`), `empty` (`'Nothing to show yet.'`). **Do not** wire `state`
(`'empty'`/`'loading'`/`'error'` — selects which render branch runs, not displayed text; also
called out by name in `docs/guides/i18n.md` §1).

**`dv-toast-stack`** — wire `label` (`'Notifications'`, already via `str()`) and the
`aria-label="Dismiss"` on each item's dismiss button, which is currently hardcoded directly in
the template (never routed through `str()` at all — same situation as `dv-modal`'s `close`
aria-label was before TASK-008, and `dv-pagination`'s several un-`str()`'d strings in TASK-009).

Out of scope: any component other than these three. `dv-pagination`/`dv-data-table` (TASK-009)
and `dv-autocomplete`/`dv-dropdown`/`dv-tabs`/`dv-product-card`/`dv-toast` (TASK-011) are owned by
sibling tasks running in parallel — don't touch their files.

## Acceptance criteria

Per `docs/guides/i18n.md` §6, for each of the three components: a test proving the locale bundle
entry is used when active, a test proving a `data-*` override still wins (ADR-0005 regression),
and a test proving the unchanged fallback still applies with no locale/override set.

- `npm test` and `npx playwright test` pass.
- `npm run lint` clean.
- `npm run size` unchanged (3352 B/4096 B) — confirm explicitly.
- `en` bundle values are byte-for-byte identical to today's hardcoded defaults.
- `tr` bundle provided for every wired key.
- `atomic-components.test.js` has smoke-test entries touching `dv-field` (two entries: `'field
  reports value and native validity'` and `'field renders select options and retains native
  control semantics'`) and `dv-state` (`'state emits retry in its error state'`) — **this file is
  shared across all three parallel i18n-wiring tasks this round.** Edit only your three
  components' entries; do not touch `dv-pagination`/`dv-data-table`/`dv-autocomplete`/
  `dv-dropdown`/`dv-product-card`'s entries (same append-only-your-own-region discipline as
  `CHANGELOG.md`). `dv-toast-stack` has no entry in that shared file — its coverage lives entirely
  in `tests/unit/dv-toast-stack.test.js`.
- CHANGELOG entry under `[Unreleased]` (append-only, shared with the sibling tasks — expect a
  routine multi-append conflict at merge time, same as every previous round).

## Inputs

- `docs/guides/i18n.md` (the how-to, especially §1's config-vs-copy guidance), `adr/0019-i18n-locale-primitive.md`
  (the design), one of `src/components/dv-modal.js` / `dv-confirm.js` / `dv-cart.js` + its
  `*.locale.js` (the reference implementations).
- `src/components/dv-field.js`, `dv-state.js`, `dv-toast-stack.js`, their current test files, and
  `dv-field`/`dv-state`'s entries in `tests/unit/atomic-components.test.js`.

## Roles and outputs

| Role | Owner | Output file | Depends on |
| --- | --- | --- | --- |
| Orchestrator | claude (this session) | `docs/swarm/tasks/TASK-010-i18n-wiring-field-state-toast-stack.md` | — |
| Implementer | dispatched agent (isolated worktree) | `docs/swarm/handoffs/TASK-010-implementer.md` | — |

## Exclusive file ownership

| Path or glob | Sole writer | Branch/worktree |
| --- | --- | --- |
| `src/components/dv-field.js`, `dv-field.locale.js` (new), `dv-state.js`, `dv-state.locale.js` (new), `dv-toast-stack.js`, `dv-toast-stack.locale.js` (new) | TASK-010 implementer | isolated worktree, branch `swarm/task-010-i18n-wiring-field-state-toast-stack` |
| `tests/unit/dv-field.test.js`, `tests/unit/dv-state.test.js`, `tests/unit/dv-toast-stack.test.js` | TASK-010 implementer | same |
| `tests/unit/atomic-components.test.js` — **only the `dv-field` and `dv-state` test entries** | TASK-010 implementer | same, shared file, edit only your own components' entries |
| `CHANGELOG.md` (append-only) | shared append-only across TASK-009/010/011, reconciled at merge | same |

No overlap with TASK-009's or TASK-011's component files.

## Gates

- [ ] Implementation verified (`npm run verify` green in the task's worktree)
- [ ] Handoff written with evidence and open questions (`docs/swarm/handoffs/TASK-010-implementer.md`)
- [ ] Orchestrator integration review complete
- [ ] Human merge approval received
