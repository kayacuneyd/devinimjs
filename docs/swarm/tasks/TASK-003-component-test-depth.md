# Task: TASK-003 — Component test depth backfill

## Goal

Deepen unit test coverage across the component library. `docs/roadmap.md` P0 frames this as "9 of
16 components have no dedicated unit test file" — verified more precisely during orchestration:
**13 of 16 components have exactly one happy-path smoke test** (either their own file or a shared
one-test-each entry in `tests/unit/atomic-components.test.js`), only `dv-counter` (7 tests) and
`dv-tabs` (12 tests, the current best-practice example) have real scenario coverage. The actual
gap is depth, not presence — treat `tests/unit/dv-tabs.test.js` as the target quality bar, not "any
test file existing."

## Scope and non-goals

In scope — add edge-case, keyboard, and error-state tests (modeled on `dv-tabs.test.js`'s
structure) for these components, in priority order by interaction complexity:

1. `dv-autocomplete` — keyboard nav (arrow/Enter/Escape), no-match state, `close()`'s
   `setTimeout`+`onCleanup` interaction (recently touched by ADR-0015's cleanup fix — verify it
   actually fires), selecting via mouse vs. keyboard.
2. `dv-data-table` — sort direction toggling, sorting by different column types, empty-rows state.
3. `dv-dropdown` — outside-click close, Escape close, keyboard activation.
4. `dv-modal` — focus placed on open, Escape close, opener-focus-return on close (document the
   current lack of a focus-trap cycle as a known limitation via a test that demonstrates the gap,
   rather than silently working around it — this feeds `docs/roadmap.md`'s P1 focus-trap item).
5. `dv-field` — validity states for each control type (`input`/`textarea`/`select`), boolean
   attribute rendering (this file was touched by the "render field boolean attributes correctly"
   fix in recent history — add regression coverage for that specific behavior if it's thin).
6. `dv-toast-stack` — the ADR-0015 timer/`onCleanup` fix from this session (dismiss-before-timeout
   cancels the cleanup registration correctly; multiple concurrent toasts).
7. `dv-confirm`, `dv-product-card`, `dv-state`, `dv-pagination`, `dv-disclosure`, `dv-search`,
   `dv-toast`, `dv-cart` — one additional meaningful edge-case test each (not just a second happy
   path) if time allows; lower priority than 1–6 above.

Out of scope:
- Do NOT modify any `src/components/*.js` or `src/core/*.js` implementation file. If testing
  reveals an actual bug (not just a documented limitation like the modal focus-trap), stop and
  report it in the handoff rather than fixing it — a test task does not silently become a fix
  task.
- Do NOT add a new test framework or assertion library; keep using `node:test` +
  `node:assert/strict` + `happy-dom`, matching every existing file.
- Do NOT delete or restructure `tests/unit/atomic-components.test.js`'s existing tests — add
  alongside, or migrate a component's test into its own file only if that clearly improves
  readability (your call, note the reasoning if you do).

## Acceptance criteria

- `npm test` passes with a materially higher `# tests` count (currently 90) and no reduction in
  existing coverage.
- Every component listed in priority 1–6 has at least 3 distinct test cases covering interaction
  edge cases, not just initial render.
- The `dv-modal` focus-trap limitation is captured as an explicit, passing test with a comment
  pointing at `docs/roadmap.md`'s P1 item — not silently asserted around.
- `npm run lint` and `npm run size` remain green (test-only change; size gate should be
  unaffected, confirm it explicitly).
- CHANGELOG entry under `[Unreleased]` summarizing the coverage work (one line, not a per-test
  list).

## Inputs

- Product/feature spec: `docs/roadmap.md` P0 — "Component test coverage lags the catalog."
- Relevant ADRs: `adr/0008-testing-strategy.md`, `adr/0015-error-boundary.md` (for the toast-stack/
  autocomplete cleanup regression tests).
- Read first: `tests/unit/dv-tabs.test.js` (the quality bar), `tests/unit/atomic-components.test.js`
  (current shallow coverage for 9 components), each target component's source file, `docs/roadmap.md`.

## Roles and outputs

| Role | Owner | Output file | Depends on |
| --- | --- | --- | --- |
| Orchestrator | this session (claude) | `docs/swarm/tasks/TASK-003-component-test-depth.md` | — |
| Implementer | dispatched agent (isolated worktree) | `docs/swarm/handoffs/TASK-003-implementer.md` | — |

## Exclusive file ownership

| Path or glob | Sole writer | Branch/worktree |
| --- | --- | --- |
| `tests/unit/*.test.js` (test files only, no `src/` changes) | TASK-003 implementer | isolated worktree, branch `swarm/task-003-component-test-depth` |
| `CHANGELOG.md` (append-only, small edit) | TASK-003 implementer | same |

No overlap with `src/` (TASK-001/002 don't touch `src/` either). `CHANGELOG.md` is shared
append-only with TASK-001/002 — reconciled at merge, per TASK-002's note on this.

## Gates

- [ ] Implementation verified (`npm run verify` green in the task's worktree)
- [ ] Handoff written with evidence and open questions (`docs/swarm/handoffs/TASK-003-implementer.md`)
- [ ] Orchestrator integration review complete
- [ ] Human merge approval received
