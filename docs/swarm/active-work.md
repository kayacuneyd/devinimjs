# Active Swarm Work

| Task | Status | Orchestrator | Implementation branch/worktree | Next gate |
| --- | --- | --- | --- | --- |
| [TASK-001](tasks/TASK-001-starter-kit-cli.md) — Starter-kit scaffolding CLI | Merged to `main` | claude (this session) | `swarm/task-001-starter-kit-cli` | Closed |
| [TASK-002](tasks/TASK-002-type-declarations.md) — Generated `.d.ts` type declarations | Merged to `main` | claude (this session) | `swarm/task-002-type-declarations` | Closed |
| [TASK-003](tasks/TASK-003-component-test-depth.md) — Component test depth backfill | Merged to `main` | claude (this session) | `swarm/task-003-component-test-depth` | Closed |
| [TASK-004](tasks/TASK-004-data-table-pagination-filtering.md) — `dv-data-table` pagination/filtering | Merged to `main` | claude (this session) | `swarm/task-004-data-table-pagination-filtering` | Closed |
| [TASK-005](tasks/TASK-005-pagination-page-list.md) — `dv-pagination` page-number list/jump-to-page | Merged to `main` | claude (this session) | `swarm/task-005-pagination-page-list` | Closed |
| [TASK-006](tasks/TASK-006-modal-focus-trap.md) — `dv-modal` focus-trap/nested-modal | Merged to `main` | claude (this session) | `swarm/task-006-modal-focus-trap` | Closed |
| [TASK-007](tasks/TASK-007-transition-primitives.md) — Transition primitives (`dv-modal`/`dv-toast`/`dv-toast-stack`/`dv-disclosure`) | Merged to `main` | claude (this session) | `swarm/task-007-transition-primitives` | Closed |
| [TASK-008](tasks/TASK-008-i18n-primitive-reference-wiring.md) — i18n/locale primitive design + reference wiring (`dv-modal`/`dv-confirm`/`dv-cart`) | Merged to `main` | claude (this session) | `swarm/task-008-i18n-primitive-reference-wiring` | Closed |

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

Implemented, independently verified, and merged to `main` 2026-07-24 (human-approved): new
`src/core/transition.js` primitive (`awaitTransition`, kept out of the size-gated `core.js`
export barrel), wired into all four named components; `dv-tabs` explicitly deferred (different
crossfade state-machine shape, see ADR-0018). Post-merge on `main`: 174 unit + 21 e2e tests, lint
clean, size gate unchanged (3352 B/4096 B, byte-for-byte identical to baseline). See
[`reviews/TASK-007-orchestrator-review.md`](reviews/TASK-007-orchestrator-review.md).
`docs/roadmap.md` P1 updated accordingly.

TASK-008 opened 2026-07-24 for the last remaining P1 item: i18n/locale-bundle system for
component copy. Scoped deliberately as design-first: the primitive itself plus exactly three
reference components (`dv-modal`, `dv-confirm`, `dv-cart` — chosen to cover a single string, a
multi-string case, and parameterized/interpolated strings). Locale bundles are required to be
co-located per-component (not one shared locale file) specifically so that wiring the remaining
~10 components can split cleanly across parallel follow-up tasks once this contract is fixed and
merged — that split is intentionally deferred to its own round rather than designed by committee
alongside this one.

Implemented, independently verified, and merged to `main` 2026-07-24 (human-approved): new
`src/core/i18n.js` primitive (`t`, `registerLocales`, `setLocale`, `getLocale`,
`onLocaleChange`; standalone, kept out of the size-gated `core.js` export barrel — measured
against an in-budget alternative, see ADR-0019), wired into `dv-modal`/`dv-confirm`/`dv-cart`
with `en`/`tr` bundles. Fixed two real pre-existing bugs as a disclosed side effect (kebab-case
`dataset[key]` lookups in `dv-confirm`/`dv-cart` that silently never worked). Post-merge on
`main`: 193 unit + 23 e2e tests, lint clean, size gate unchanged (3352 B/4096 B). See
[`reviews/TASK-008-orchestrator-review.md`](reviews/TASK-008-orchestrator-review.md).
`docs/roadmap.md` P1 updated (marked partially closed — the primitive and 3 reference components
are done, ~10 components remain).

**Recommended next round (not yet opened):** wire the remaining ~10 components
(`dv-autocomplete`, `dv-data-table`, `dv-dropdown`, `dv-field`, `dv-pagination`,
`dv-product-card`, `dv-state`, `dv-tabs`, `dv-toast`, `dv-toast-stack`) into the `t()`/
`registerLocales()` contract per `docs/guides/i18n.md` — this is the first round with true
zero-file-overlap parallelism available (each component's own file + its own `*.locale.js`,
nothing shared to reconcile), so it can split across as many parallel tasks as desired. Also
recommended: a small standalone task to refresh `docs/component-manifest.json` (stale since
TASK-004, unrelated to i18n specifically).
