# Task: TASK-004 — `dv-data-table` pagination and filtering

## Goal

Close `docs/roadmap.md` P1's highest-leverage gap: `dv-data-table` has no pagination or filtering,
which blocks the DizgeCMS Studio / admin-panel use case DizgePHP already ships. Add client-side
pagination and a text filter over the already-loaded row set, keeping the component's existing
"small, already-loaded rows" design intent (see its module docstring) intact.

## Scope and non-goals

In scope:

- A text filter input that narrows `this.state.rows` by substring match across all visible
  column values (case-insensitive), re-applied on every render.
- Pagination of the filtered/sorted result set. **Compose the existing `<dv-pagination>` element**
  for the page controls (import it, render it in the template, listen for its `dv:page` event) —
  do not reimplement Prev/Next/page-count logic. `dv-pagination`'s attribute contract
  (`data-page`/`data-total`/`data-size`, one-based, `dv:page` event) is stable; treat it as a
  black box.
- A `data-page-size` attribute (default e.g. 10) controlling rows per page; 0 or absent means "no
  pagination" (show all filtered/sorted rows) — preserves current behavior for existing callers
  that never set it.
- Filtering and pagination must compose correctly with existing sort: sort the full filtered set,
  then slice the current page from it.
- Update `sortBy` if needed so changing sort resets to page 1 (avoid landing on an empty page).
- Update `design/component-library.md` or wherever `dv-data-table`'s attribute contract is
  documented, if such a reference doc exists — grep for it first.

Out of scope:

- **Virtualization/windowed rendering** — a real architectural change (the component would need
  to stop assuming "already-loaded, all in DOM"), needs its own measurement-backed ADR per
  constitution §2.1 (YAGNI). Do not attempt it here; leave it as a roadmap item.
- Server-side pagination/filtering (page-fetch-per-request) — out of scope, this component's
  model is client-side over already-loaded JSON per its docstring.
- Fixing the existing numeric-sort-is-lexicographic behavior
  (`tests/unit/dv-data-table.test.js:74`, "documents a real gap") **unless** it's trivial once
  you're already touching the sort code — if you fix it, keep the fix minimal (numeric-aware
  comparison when both values parse as numbers) and update that test's name/assertion instead of
  leaving a stale "documents a real gap" test next to newly-correct behavior. If it's not trivial,
  leave it alone and don't scope-creep.
- Do not modify `src/components/dv-pagination.js` — TASK-005 owns that file in this swarm round.

## Acceptance criteria

- `npm test` passes; new tests cover: filter narrows visible rows, filter + sort interaction,
  pagination slicing, page reset on filter/sort change, `data-page-size` absent/0 preserves
  current no-pagination behavior (regression), empty-filtered-result state.
- `npm run lint` and `npm run size` remain green — confirm the size delta explicitly in the
  handoff (this task adds real code, unlike TASK-001..003; the 4 KB gate is real pressure here).
- `dv-pagination` is composed, not reimplemented — grep the diff for any hand-rolled
  prev/next/page-count logic in `dv-data-table.js` as a self-check before writing the handoff.
- CHANGELOG entry under `[Unreleased]`.

## Inputs

- Relevant roadmap gap: `docs/roadmap.md` P1 — "`dv-data-table` has no pagination/filtering/
  virtualization."
- Read first: `src/components/dv-data-table.js`, `src/components/dv-pagination.js` (the API you're
  composing, not editing), `tests/unit/dv-data-table.test.js`, `adr/0010-mvp-scope.md` (component
  scoping precedent), `adr/0014-keyed-morph.md` (if row list rendering interacts with keying).

## Roles and outputs

| Role | Owner | Output file | Depends on |
| --- | --- | --- | --- |
| Orchestrator | claude (this session) | `docs/swarm/tasks/TASK-004-data-table-pagination-filtering.md` | — |
| Implementer | dispatched agent (isolated worktree) | `docs/swarm/handoffs/TASK-004-implementer.md` | — |

## Exclusive file ownership

| Path or glob | Sole writer | Branch/worktree |
| --- | --- | --- |
| `src/components/dv-data-table.js` | TASK-004 implementer | isolated worktree, branch `swarm/task-004-data-table-pagination-filtering` |
| `tests/unit/dv-data-table.test.js` | TASK-004 implementer | same |
| `CHANGELOG.md` (append-only) | shared append-only across this round's tasks, reconciled at merge | same |

No overlap with `src/components/dv-pagination.js` (TASK-005) or `src/components/dv-modal.js`
(TASK-006) — this task only *imports and uses* `dv-pagination` as a black-box dependency.

## Gates

- [ ] Implementation verified (`npm run verify` green in the task's worktree)
- [ ] Handoff written with evidence and open questions (`docs/swarm/handoffs/TASK-004-implementer.md`)
- [ ] Orchestrator integration review complete
- [ ] Human merge approval received
