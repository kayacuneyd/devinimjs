# Task: TASK-005 — `dv-pagination` page-number list and jump-to-page

## Goal

Close `docs/roadmap.md` P1: `dv-pagination` is currently Prev/Next-only, with no page-number list
or jump-to-page control — an admin-panel gap shared with TASK-004's `dv-data-table` work (which
composes this component; do not change its existing attribute/event contract in a
backward-incompatible way — TASK-004 depends on it staying stable).

## Scope and non-goals

In scope:

- Render a page-number list between the Prev/Next buttons (e.g. `1 2 3 … 8 9 10` style truncation
  once the page count exceeds a reasonable window — pick a sane default window size, e.g. 7 total
  slots including current ± 2 and the first/last page, with `…` ellipsis markers for gaps). Each
  page-number button reuses the existing `goToButton`/`goTo` mechanism and `dv:page` event — do
  not add a second event type.
- A jump-to-page control (a numeric input + submit, or `<select>` — your call, document the
  choice) that calls `goTo()` with the entered value, clamped the same way `goTo` already clamps.
  Invalid/out-of-range input must not crash or emit an out-of-range page.
- Keep `data-page`/`data-total`/`data-size` as the only observed attributes and `dv:page` as the
  only emitted event — this is the contract TASK-004 is coding against in parallel.
- Accessibility: page-number buttons need `aria-current="page"` on the active one (move it from
  the current plain `<span>`, or keep both — your call), `aria-label` on Prev/Next/jump controls
  sufficient for a screen reader to distinguish them without relying on visual position.

Out of scope:

- Do not change `goTo`'s clamping semantics or the one-based page model.
- Do not touch `src/components/dv-data-table.js` (TASK-004 owns it) or
  `src/components/dv-modal.js` (TASK-006 owns it).
- Don't add a page-size selector UI — `data-size` stays attribute-only, out of this task's scope.

## Acceptance criteria

- `npm test` passes; new tests cover: page-number list renders and truncates correctly at small
  and large page counts, clicking a page number emits the right `dv:page`, jump-to-page valid
  input navigates correctly, jump-to-page invalid/out-of-range input is clamped/ignored without
  throwing, `aria-current` lands on the correct button.
- Existing pagination tests (`tests/unit/dv-pagination.test.js`) keep passing unmodified in
  intent — if you must adjust an existing assertion (e.g. because the DOM structure changed),
  explain why in the handoff; don't silently loosen a test to make it pass.
- `npm run lint` and `npm run size` remain green — confirm the size delta explicitly in the
  handoff.
- CHANGELOG entry under `[Unreleased]`.

## Inputs

- Relevant roadmap gap: `docs/roadmap.md` P1 — "`dv-pagination` is Prev/Next only — no
  page-number list or jump-to-page; same admin-panel gap."
- Read first: `src/components/dv-pagination.js`, `tests/unit/dv-pagination.test.js`. Skim
  `docs/swarm/tasks/TASK-004-data-table-pagination-filtering.md` so you know another task is
  composing this component concurrently and depends on the existing attribute/event contract not
  breaking.

## Roles and outputs

| Role | Owner | Output file | Depends on |
| --- | --- | --- | --- |
| Orchestrator | claude (this session) | `docs/swarm/tasks/TASK-005-pagination-page-list.md` | — |
| Implementer | dispatched agent (isolated worktree) | `docs/swarm/handoffs/TASK-005-implementer.md` | — |

## Exclusive file ownership

| Path or glob | Sole writer | Branch/worktree |
| --- | --- | --- |
| `src/components/dv-pagination.js` | TASK-005 implementer | isolated worktree, branch `swarm/task-005-pagination-page-list` |
| `tests/unit/dv-pagination.test.js` | TASK-005 implementer | same |
| `CHANGELOG.md` (append-only) | shared append-only across this round's tasks, reconciled at merge | same |

No overlap with `src/components/dv-data-table.js` (TASK-004) or `src/components/dv-modal.js`
(TASK-006).

## Gates

- [ ] Implementation verified (`npm run verify` green in the task's worktree)
- [ ] Handoff written with evidence and open questions (`docs/swarm/handoffs/TASK-005-implementer.md`)
- [ ] Orchestrator integration review complete
- [ ] Human merge approval received
