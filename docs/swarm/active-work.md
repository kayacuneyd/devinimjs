# Active Swarm Work

| Task | Status | Orchestrator | Implementation branch/worktree | Next gate |
| --- | --- | --- | --- | --- |
| [TASK-001](tasks/TASK-001-starter-kit-cli.md) — Starter-kit scaffolding CLI | Merged to `main` | claude (this session) | `swarm/task-001-starter-kit-cli` | Closed |
| [TASK-002](tasks/TASK-002-type-declarations.md) — Generated `.d.ts` type declarations | Merged to `main` | claude (this session) | `swarm/task-002-type-declarations` | Closed |
| [TASK-003](tasks/TASK-003-component-test-depth.md) — Component test depth backfill | Merged to `main` | claude (this session) | `swarm/task-003-component-test-depth` | Closed |

All three merged 2026-07-23 (human-approved). Post-merge: `.claude/` worktree/lint noise fixed
(eslint ignores + `.gitignore`), and the two bugs found as a side effect were fixed directly on
`main` (not worth their own swarm task) — see `CHANGELOG.md`. Full evidence in
[`reviews/TASK-001-003-orchestrator-review.md`](reviews/TASK-001-003-orchestrator-review.md).

Next candidates from `docs/roadmap.md`'s P1 list: `dv-data-table` pagination/filtering,
`dv-pagination` page-number list, store selector subscriptions, animation/transition primitives,
`dv-modal` focus-trap, i18n. None opened yet — awaiting direction on which to take next.
