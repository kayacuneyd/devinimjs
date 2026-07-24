# Task: TASK-009 — i18n wiring: `dv-pagination`, `dv-data-table`

## Goal

Wire `dv-pagination` and `dv-data-table` into the i18n/locale primitive from ADR-0019
(`src/core/i18n.js`), following `docs/guides/i18n.md` step by step. This is part of the
parallel follow-up round mentioned in `docs/swarm/active-work.md`: TASK-008 built the primitive
and wired three reference components; this task and its siblings (TASK-010, TASK-011, opened
alongside this one) wire the remaining ~10. Locale bundles are co-located per-component by
design, so these three tasks touch disjoint `src/components/*.js`/`*.locale.js` files and can run
fully in parallel.

These two components are grouped together (not split across different parallel tasks) because
they interact: `dv-data-table` composes `<dv-pagination>` (TASK-004) and forwards its own
`pagination-label` string as `<dv-pagination>`'s `data-label` attribute override. Wiring both in
one task lets you verify that composition still resolves correctly once both sides go through
`t()` — you don't need to design anything new for this (the existing three-tier resolution
already handles it: `dv-data-table` resolves its own copy via `t()`, then forwards the *resolved*
string as a `data-*` override, which is `dv-pagination`'s own top-priority tier) but it's worth
one explicit test proving the forwarding chain still works end-to-end under a non-English locale.

## Scope and non-goals

Read `docs/guides/i18n.md` in full before starting — it is the authoritative how-to; this section
only lists what's specific to these two components.

**`dv-pagination`** has more hardcoded-English surface than most components — some already routed
through `str()`, some not (added directly in TASK-005, never audited for i18n since the primitive
didn't exist yet):
- Already via `str()`: `label` (`'Pagination'`), `jumpLabel` (`'Jump to page'`).
- **Not currently via `str()` at all** — bring these under `t()` too: the `"Previous"`/`"Next"`
  button text, the `aria-label="Previous page"` / `aria-label="Next page"` / `aria-label="Page
  ${entry}"` (parameterized — use `{page}` or similar), `aria-label="Jump to page, 1 to
  ${pages}"` (parameterized), and the `"Go"` submit button text.

**`dv-data-table`**:
- `filter-label` (`'Filter'`), `label` (`'Data table'`), `pagination-label` (`'Pagination'` —
  forwarded to the composed `<dv-pagination>`, see Goal above).

Not copy, don't wire (config, unrelated to this task's components but listed in
`docs/guides/i18n.md` §1 for reference — nothing in these two components' `str()` calls is
config-shaped, this note is just a reminder to re-check before assuming otherwise).

Out of scope: any component other than these two. `dv-field`, `dv-state`, `dv-toast-stack`
(TASK-010) and `dv-autocomplete`, `dv-dropdown`, `dv-tabs`, `dv-product-card`, `dv-toast`
(TASK-011) are owned by sibling tasks running in parallel — don't touch their files.

## Acceptance criteria

Per `docs/guides/i18n.md` §6, for each of the two components: a test proving the locale bundle
entry is used when active, a test proving a `data-*` override still wins (ADR-0005 regression), a
test proving the unchanged fallback still applies with no locale/override, and — for
`dv-pagination`'s parameterized `aria-label="Page ${entry}"` — a test proving substitution doesn't
cross-contaminate across multiple page-number buttons. Plus one test proving `dv-data-table`'s
forwarded `pagination-label` reaches the composed `<dv-pagination>` correctly under a non-English
active locale.

- `npm test` and `npx playwright test` pass.
- `npm run lint` clean.
- `npm run size` unchanged (3352 B/4096 B) — this should be automatic (you're importing `t` the
  same way the three reference components already do, not adding anything to `core.js`'s barrel),
  but confirm it explicitly anyway.
- `en` bundle values are byte-for-byte identical to today's hardcoded defaults — this is a wiring
  task, not a wording change.
- `tr` bundle provided for every wired key.
- `atomic-components.test.js` has smoke-test entries for `dv-data-table` (`'data table sorts rows
  and emits its ordering'`) — **this file is shared across all three parallel i18n-wiring tasks
  this round.** Edit only the `dv-data-table` entry; do not touch any other component's entry in
  that file (same append-only-your-own-region discipline as `CHANGELOG.md`).
- CHANGELOG entry under `[Unreleased]` (append-only, shared with the sibling tasks — expect a
  routine multi-append conflict at merge time, same as every previous round).

## Inputs

- `docs/guides/i18n.md` (the how-to), `adr/0019-i18n-locale-primitive.md` (the design), one of
  `src/components/dv-modal.js` / `dv-confirm.js` / `dv-cart.js` + its `*.locale.js` (the reference
  implementations — `dv-cart.locale.js` is the closest precedent for parameterized strings, which
  you'll need for `dv-pagination`'s page-number aria-labels).
- `src/components/dv-pagination.js`, `dv-data-table.js`, their current test files
  (`tests/unit/dv-pagination.test.js`, `tests/unit/dv-data-table.test.js`), and their entries in
  `tests/unit/atomic-components.test.js`.

## Roles and outputs

| Role | Owner | Output file | Depends on |
| --- | --- | --- | --- |
| Orchestrator | claude (this session) | `docs/swarm/tasks/TASK-009-i18n-wiring-pagination-data-table.md` | — |
| Implementer | dispatched agent (isolated worktree) | `docs/swarm/handoffs/TASK-009-implementer.md` | — |

## Exclusive file ownership

| Path or glob | Sole writer | Branch/worktree |
| --- | --- | --- |
| `src/components/dv-pagination.js`, `dv-pagination.locale.js` (new), `dv-data-table.js`, `dv-data-table.locale.js` (new) | TASK-009 implementer | isolated worktree, branch `swarm/task-009-i18n-wiring-pagination-data-table` |
| `tests/unit/dv-pagination.test.js`, `tests/unit/dv-data-table.test.js` | TASK-009 implementer | same |
| `tests/unit/atomic-components.test.js` — **only the `dv-data-table` test entry** | TASK-009 implementer | same, shared file, edit only your own component's entry |
| `CHANGELOG.md` (append-only) | shared append-only across TASK-009/010/011, reconciled at merge | same |

No overlap with TASK-010's or TASK-011's component files.

## Gates

- [ ] Implementation verified (`npm run verify` green in the task's worktree)
- [ ] Handoff written with evidence and open questions (`docs/swarm/handoffs/TASK-009-implementer.md`)
- [ ] Orchestrator integration review complete
- [ ] Human merge approval received
