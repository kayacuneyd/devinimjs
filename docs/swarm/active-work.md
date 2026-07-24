# Active Swarm Work

| Task | Status | Orchestrator | Implementation branch/worktree | Next gate |
| --- | --- | --- | --- | --- |
| [TASK-001](tasks/TASK-001-starter-kit-cli.md) — Starter-kit scaffolding CLI | Merged to `main` | claude (this session) | `swarm/task-001-starter-kit-cli` | Closed |
| [TASK-002](tasks/TASK-002-type-declarations.md) — Generated `.d.ts` type declarations | Merged to `main` | claude (this session) | `swarm/task-002-type-declarations` | Closed |
| [TASK-003](tasks/TASK-003-component-test-depth.md) — Component test depth backfill | Merged to `main` | claude (this session) | `swarm/task-003-component-test-depth` | Closed |
| [TASK-004](tasks/TASK-004-data-table-pagination-filtering.md) — `dv-data-table` pagination/filtering | Merged to `main` | claude (this session) | `swarm/task-004-data-table-pagination-filtering` | Closed |
| [TASK-005](tasks/TASK-005-pagination-page-list.md) — `dv-pagination` page-number list/jump-to-page | Merged to `main` | claude (this session) | `swarm/task-005-pagination-page-list` | Closed |
| [TASK-006](tasks/TASK-006-modal-focus-trap.md) — `dv-modal` focus-trap/nested-modal | Merged to `main` | claude (this session) | `swarm/task-006-modal-focus-trap` | Closed |
| [TASK-007](tasks/TASK-007-transition-primitives.md) — Transition primitives (`dv-modal`/`dv-toast`/`dv-toast-stack`/`dv-disclosure`) | Reviewed, awaiting merge approval | claude (this session) | `swarm/task-007-transition-primitives` | Human merge approval |

TASK-001..003 merged 2026-07-23 (human-approved). Post-merge: `.claude/` worktree/lint noise fixed
(eslint ignores + `.gitignore`), and the two bugs found as a side effect were fixed directly on
`main` (not worth their own swarm task) — see `CHANGELOG.md`. Full evidence in
[`reviews/TASK-001-003-orchestrator-review.md`](reviews/TASK-001-003-orchestrator-review.md).

TASK-004..006 opened 2026-07-24 from `docs/roadmap.md`'s P1 list, chosen as the subset with no
file-ownership overlap (each owns exactly one `src/components/*.js` file + its test file). The
store-selector-subscriptions P1 item was found to be **already implemented and tested**
(`BaseComponent#useStore(store, paths)`) during orchestration — no task opened for it; corrected
directly in `docs/roadmap.md`. Animation/transition primitives and i18n are deferred to a later
round: animation would conflict with TASK-006's `dv-modal.js` ownership, and i18n touches nearly
every component's default copy, conflicting with all three tasks above.

All three implemented, independently verified, and merged to `main` 2026-07-24 (human-approved).
A real (expected) integration incompatibility between TASK-004 and TASK-005 — both composed/
reshaped `dv-pagination` from different sides — was found and fixed during orchestrator review
(folded into the merge, not a separate follow-up commit); see
[`reviews/TASK-004-006-orchestrator-review.md`](reviews/TASK-004-006-orchestrator-review.md) for
full evidence. Post-merge on `main`: 163 unit + 19 e2e tests, lint clean, size gate passed
(3352 B/4096 B, unchanged). `docs/roadmap.md` P1 updated accordingly.

TASK-007 opened 2026-07-24: animation/transition primitives for `dv-modal`/`dv-toast`/
`dv-toast-stack`/`dv-disclosure`. Opened alone (not paired with another task) — i18n, the only
other remaining P1 item, touches nearly every component's default copy including all four this
task touches, so it's deferred to its own round once TASK-007 merges.

Implemented and independently verified 2026-07-24: new `src/core/transition.js` primitive
(`awaitTransition`, kept out of the size-gated `core.js` export barrel), wired into all four
named components; `dv-tabs` explicitly deferred (different crossfade state-machine shape, see
ADR-0018). 174 unit + 21 e2e tests, lint clean, size gate unchanged (3352 B/4096 B, byte-for-byte
identical to baseline). See
[`reviews/TASK-007-orchestrator-review.md`](reviews/TASK-007-orchestrator-review.md). Awaiting
human merge approval per swarm rule 6.
