# Handoff: TASK-003 — Implementer

## Status

Complete.

## Inputs reviewed

- `docs/swarm/README.md`, `docs/swarm/tasks/TASK-003-component-test-depth.md` (full task contract).
- `adr/0008-testing-strategy.md`, `adr/0015-error-boundary.md`.
- `docs/roadmap.md` (P0 test-coverage gap, P1 focus-trap item).
- `tests/unit/dv-tabs.test.js` (quality bar) and `tests/unit/atomic-components.test.js` (existing
  shallow coverage — left untouched, per the task's non-goals).
- Source of every priority 1–7 component: `dv-autocomplete.js`, `dv-data-table.js`,
  `dv-dropdown.js`, `dv-modal.js`, `dv-field.js`, `dv-toast-stack.js`, `dv-confirm.js`,
  `dv-product-card.js`, `dv-state.js`, `dv-pagination.js`, `dv-disclosure.js`, `dv-search.js`,
  `dv-toast.js`, `dv-cart.js`, plus `src/core/base-component.js` and `src/core/html.js` (read-only,
  to understand `onCleanup`/error-boundary and the boolean-attribute rendering rule — never
  modified).

**Setup note:** this worktree's branch (`worktree-agent-af1bdbf7b26d5621f`, later renamed to
`swarm/task-003-component-test-depth`) was created from commit `186b124`, three commits behind
`main` (`419f0b0`), and was missing `docs/swarm/`, `docs/roadmap.md`, `adr/0015-error-boundary.md`
and the already-landed ADR-0015 implementation (`onCleanup`, `onError`) entirely. Since the
worktree had zero local commits (`git rev-list --left-right --count HEAD...main` → `0 3`), I did a
plain `git merge --ff-only main` before starting — a safe fast-forward, not a merge with any
conflict risk — to pick up the task file and prerequisite ADR-0015 code the task explicitly
depends on (dv-autocomplete's/dv-toast-stack's `onCleanup` usage). Flagging this in case the
worktree-provisioning step for future tasks should branch from `main` at dispatch time instead.

## Evidence and findings

- Baseline: `npm test` → **90 tests, 90 pass** (confirmed before writing anything, matching the
  task file's stated baseline exactly).
- Final: `npm test` → **137 tests, 137 pass, 0 fail** (ran twice back-to-back to check for
  timing-related flakiness in the timer-heavy toast/toast-stack tests — stable both times).
- `npm run lint` → clean, no errors/warnings.
- `npm run size` → `core bundle: 8368 B min, 3352 B min+gzip (budget 4096 B)` — **unchanged**
  from before this change (test-only diff, no `src/`/`dist/` touched), gate passes.
- Every priority 1–6 component has ≥3 new edge-case tests (actual counts: dv-autocomplete 7,
  dv-data-table 6, dv-dropdown 6, dv-modal +5 new alongside its 1 existing, dv-field 7,
  dv-toast-stack 6).
- The dv-modal focus-trap limitation is captured as an explicit passing test
  (`tests/unit/dv-modal.test.js`, `'KNOWN GAP: Tab is not trapped inside the dialog…'`) with a
  comment pointing at `docs/roadmap.md`'s P1 item, per the acceptance criteria.
- No `src/` file was modified (verified via `git status`/`git diff --stat`).
- `tests/unit/atomic-components.test.js` was not modified (verified via `git diff --stat --
  tests/unit/atomic-components.test.js` → empty). New depth was added in new dedicated files
  instead (my call — kept the existing shallow smoke tests as-is and added alongside, since the
  new files are large enough that folding them into the shared file would have hurt its
  readability more than it helped).

## Changed files

- `CHANGELOG.md` — one `### Tests` entry under `[Unreleased]`.
- New: `tests/unit/dv-autocomplete.test.js`, `tests/unit/dv-data-table.test.js`,
  `tests/unit/dv-dropdown.test.js`, `tests/unit/dv-field.test.js`,
  `tests/unit/dv-toast-stack.test.js`, `tests/unit/dv-confirm.test.js`,
  `tests/unit/dv-product-card.test.js`, `tests/unit/dv-state.test.js`.
- Modified (appended to, not restructured): `tests/unit/dv-modal.test.js`,
  `tests/unit/dv-disclosure.test.js`, `tests/unit/dv-pagination.test.js`,
  `tests/unit/dv-search.test.js`, `tests/unit/dv-toast.test.js`, `tests/unit/cart.test.js`.
- Commit: `2d71289` on branch `swarm/task-003-component-test-depth` (local only — not pushed, not
  merged).

## Open questions and risks

1. **Suspected real bug — `dv-field.js` line 49 (highest-priority finding).** The invalid-state
   error `<p>` uses **unquoted** `hidden=${!this.state.invalid}`, unlike every other boolean
   attribute in the codebase (which correctly uses `attr="${value}"`). Verified directly against
   `html()`'s output: when the interpolated value is `false` — i.e. exactly when the field *is*
   invalid and the message should show — the tag function's sole-attribute boolean-omission rule
   (ADR-0002 #5) doesn't match (it requires a leading quote), so `false` renders as `''`, producing
   the raw fragment `<p hidden= role="alert">…`. An HTML parser reads that as `hidden="role"` plus
   a stray `alert=""` attribute: `role="alert"` is destroyed, and the element stays `hidden` even
   though it should now be visible. **Net effect: a required field's validation message never
   actually becomes visible to sighted users, and never carries `role="alert"` for assistive tech
   either** — the `aria-invalid` attribute on the control itself is unaffected and still correct.
   Not fixed here (out of scope for a test-only task, and not the already-known modal limitation
   the task names as the one exception). Documented with a dedicated, passing test:
   `tests/unit/dv-field.test.js` → `'KNOWN BUG: the invalid-state error message never becomes
   visible or keeps role="alert" (unquoted hidden=${…} in dv-field.js)'`. Recommend a follow-up
   fix task (one-line change: quote the attribute like every other boolean attr in the file) plus
   a roadmap/ADR note if the maintainers want this tracked formally.
2. **Suspected real bug (lower severity) — `dv-data-table.js` sorts numeric-looking columns
   lexicographically, not numerically**, because sorting always does
   `String(value).localeCompare(...)` regardless of column type. E.g. `[2, 10, 3]` ascending sorts
   to `['10', '2', '3']`, not `['2', '3', '10']`. This may be intentional (there's no explicit
   numeric-column concept in the component's contract), but it's surprising enough to flag.
   Documented, not fixed: `tests/unit/dv-data-table.test.js` →
   `'a numeric-looking column sorts lexicographically, not numerically (documents a real gap)'`.
3. **Task-premise mismatches (not bugs — the task's description of these two components doesn't
   match their actual implementation):**
   - `dv-autocomplete.js` has **no keyboard-navigation handler at all** — no `data-on:keydown`
     anywhere in its template, so arrow keys, Enter and Escape do nothing beyond native `<input>`
     behavior. Only mouse/click selection and blur-triggered `close()` are real. Covered the real
     behavior instead (no-match state, mouse selection, `close()`'s `onCleanup` timing) and noted
     the gap in a file-level comment rather than writing tests for a keyboard-nav feature that
     doesn't exist.
   - `dv-dropdown.js` has **no outside-click-close behavior** — no document-level listener
     anywhere in the file, only Escape and the trigger button's click toggle. Covered this the
     same way the task asks for the modal focus-trap gap: an explicit passing test
     (`'KNOWN GAP: clicking outside the dropdown does not close it…'`) that documents current
     behavior instead of fabricating a passing "outside-click closes it" test.
4. **`docs/swarm/` was uncommitted-only in the shared checkout at task dispatch time** (see setup
   note above) — worth checking whether other in-flight task worktrees (TASK-001, TASK-002) have
   the same staleness, since they'd hit the same missing-task-file problem.

## Next recipient

Orchestrator.
