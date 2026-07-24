# Active Swarm Work

| Task | Status | Orchestrator | Implementation branch/worktree | Next gate |
| --- | --- | --- | --- | --- |
| [TASK-001](tasks/TASK-001-starter-kit-cli.md) — Starter-kit scaffolding CLI | Merged to `main` | claude (this session) | `swarm/task-001-starter-kit-cli` | Closed |
| [TASK-002](tasks/TASK-002-type-declarations.md) — Generated `.d.ts` type declarations | Merged to `main` | claude (this session) | `swarm/task-002-type-declarations` | Closed |
| [TASK-003](tasks/TASK-003-component-test-depth.md) — Component test depth backfill | Merged to `main` | claude (this session) | `swarm/task-003-component-test-depth` | Closed |
| [TASK-004](tasks/TASK-004-data-table-pagination-filtering.md) — `dv-data-table` pagination/filtering | Reviewed, awaiting merge approval | claude (this session) | `swarm/task-004-data-table-pagination-filtering` | Human merge approval |
| [TASK-005](tasks/TASK-005-pagination-page-list.md) — `dv-pagination` page-number list/jump-to-page | Reviewed, awaiting merge approval | claude (this session) | `swarm/task-005-pagination-page-list` | Human merge approval |
| [TASK-006](tasks/TASK-006-modal-focus-trap.md) — `dv-modal` focus-trap/nested-modal | Reviewed, awaiting merge approval | claude (this session) | `swarm/task-006-modal-focus-trap` | Human merge approval |

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

All three implemented and independently verified 2026-07-24. A real (expected) integration
incompatibility between TASK-004 and TASK-005 — both composed/reshaped `dv-pagination` from
different sides — was found and fixed during orchestrator review; see
[`reviews/TASK-004-006-orchestrator-review.md`](reviews/TASK-004-006-orchestrator-review.md) for
full evidence. A ready-to-use integration branch, `swarm/task-004-006-integration`, has all three
merged plus that fix, fully re-verified green (163 unit + 19 e2e tests, lint, size). Awaiting
human merge approval per swarm rule 6.
