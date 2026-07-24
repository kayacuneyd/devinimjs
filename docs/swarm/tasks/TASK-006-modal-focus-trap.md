# Task: TASK-006 — `dv-modal` focus-trap cycling and nested-modal handling

## Goal

Close `docs/roadmap.md` P1: `dv-modal` has no real focus-trap cycling, an a11y/robustness gap
already pinned by a deliberately-failing-the-gap test from TASK-003:
`tests/unit/dv-modal.test.js:100`, `'KNOWN GAP: Tab is not trapped inside the dialog — focus can
leave it (docs/roadmap.md P1)'`. This task should make that gap disappear — either flip that test
to assert the trap works, or replace it with an equivalent passing test and remove the stale
"KNOWN GAP"/"KNOWN LIMITATION" comment block above it (lines 94–99).

## Scope and non-goals

In scope:

- Standard WAI-ARIA APG dialog focus-trap: `Tab` from the last focusable element inside the dialog
  wraps to the first; `Shift+Tab` from the first wraps to the last. Implement in `onKeydown`
  (already handles `Escape`) or a dedicated handler — your call.
- Focus must stay confined to the dialog's focusable descendants (buttons, links, inputs, etc.
  inside `.dv-modal-content` / the header close button) for as long as `state.open` is true.
- Nested-modal handling: when a second `<dv-modal>` opens while another is already open, the trap
  must apply to whichever dialog is topmost/active — the outer dialog's trap must not fight the
  inner one. Decide and document the simplest correct model (e.g. a module-level open-modal stack
  that only the top entry's keydown handler acts on) — don't over-engineer a full modal-manager
  abstraction beyond what nesting correctness requires.
- Keep the existing opener-focus-return behavior (`updated()`'s `#opener?.focus()` on close) and
  initial-open auto-focus (`#focusDialog`) working exactly as today — these have passing tests,
  don't regress them.

Out of scope:

- Do not touch `src/components/dv-data-table.js` (TASK-004) or `src/components/dv-pagination.js`
  (TASK-005).
- Don't add a backdrop-click-to-close feature — not part of this gap, would be scope creep.
- Don't build a general-purpose focus-trap utility module unless the nested-modal requirement
  genuinely needs shared state across instances — if you do extract one, keep it inside
  `dv-modal.js` or a new file under `src/components/`, not `src/core/` (core budget is size-gated
  and this is component-local behavior).

## Acceptance criteria

- `npm test` passes. `tests/unit/dv-modal.test.js:100`'s gap test is flipped to green (trap
  works) or replaced with an equivalent real assertion — either way the "KNOWN GAP" framing must
  be gone from the file when you're done.
- New tests cover: Tab wraps last→first, Shift+Tab wraps first→last, nested modals (open a second
  modal while the first is open; confirm the trap now applies to the second, and reverts to the
  first correctly when the second closes).
- `npm run lint` and `npm run size` remain green — confirm the size delta explicitly in the
  handoff.
- Existing `dv-modal` tests (open/close/Escape/opener-focus-return/`data-open` sync) keep passing
  unmodified.
- CHANGELOG entry under `[Unreleased]`.

## Inputs

- Relevant roadmap gap: `docs/roadmap.md` P1 — "`dv-modal` has no real focus-trap cycling or
  nested-modal handling."
- Read first: `src/components/dv-modal.js`, `tests/unit/dv-modal.test.js` (especially the KNOWN
  GAP test and its surrounding comment), `adr/0008-testing-strategy.md`.

## Roles and outputs

| Role | Owner | Output file | Depends on |
| --- | --- | --- | --- |
| Orchestrator | claude (this session) | `docs/swarm/tasks/TASK-006-modal-focus-trap.md` | — |
| Implementer | dispatched agent (isolated worktree) | `docs/swarm/handoffs/TASK-006-implementer.md` | — |

## Exclusive file ownership

| Path or glob | Sole writer | Branch/worktree |
| --- | --- | --- |
| `src/components/dv-modal.js` | TASK-006 implementer | isolated worktree, branch `swarm/task-006-modal-focus-trap` |
| `tests/unit/dv-modal.test.js` | TASK-006 implementer | same |
| `CHANGELOG.md` (append-only) | shared append-only across this round's tasks, reconciled at merge | same |

No overlap with `src/components/dv-data-table.js` (TASK-004) or `src/components/dv-pagination.js`
(TASK-005).

## Gates

- [ ] Implementation verified (`npm run verify` green in the task's worktree)
- [ ] Handoff written with evidence and open questions (`docs/swarm/handoffs/TASK-006-implementer.md`)
- [ ] Orchestrator integration review complete
- [ ] Human merge approval received
