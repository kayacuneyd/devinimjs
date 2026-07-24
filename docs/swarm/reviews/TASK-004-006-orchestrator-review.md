# Review: TASK-004, TASK-005, TASK-006 — orchestrator integration review

## Status

Approve, pending human merge decision. One real integration incompatibility was found between
TASK-004 and TASK-005 (both developed in parallel against the pre-swarm `dv-pagination.js`) and
fixed directly during this review — details below.

## Evidence reviewed

- All three implementer handoffs (`docs/swarm/handoffs/TASK-00{4,5,6}-implementer.md`).
- Direct `git diff main..<branch> --stat` on all three branches (not just the handoff summaries).
- Re-ran `npm run lint && npm test && npm run size` on each branch **independently**, in its own
  worktree, not trusting the implementer's self-reported numbers:
  - TASK-004: lint clean, **152/152** unit tests, size 3352 B/4096 B gate passed.
  - TASK-005: lint clean, **152/152** unit tests, size 3352 B/4096 B gate passed.
  - TASK-006: lint clean, **147/147** unit tests, size 3352 B/4096 B gate passed.
  - All three branched cleanly from the same `main` commit (`e9d0001`) — no merge-base drift this
    round, unlike TASK-001/002 last round.
- Spot-verified TASK-004's headline claim against source, not just its handoff description:
  **confirmed real** — `src/core/morph.js`'s `morphNode()` only exempts the literal `<dv-outlet>`
  tag (`OUTLET_TAG`) from recursive child-diffing (ADR-0009). Composing `<dv-pagination>` directly
  in `dv-data-table`'s `template()` (the obvious approach) would have its self-rendered `<nav>`/
  button DOM diffed against the parent's template — which never describes those internals — and
  wiped out on the parent's very next re-render. The implementer's workaround (mount
  `<dv-pagination>` imperatively inside a private `<dv-outlet>`, synced from `connected()`/
  `updated()`) is architecturally sound and consistent with how `<dv-outlet>` composition already
  works elsewhere. Not a bug in this task's own code — a real, previously-undocumented constraint
  on component composition, worth a note for anyone composing custom elements inside `template()`
  in the future (`dv-modal`'s own `outlet` for children is the same pattern, already correct).
- Spot-verified TASK-006's nested-modal claim by reading `src/components/dv-modal.js` directly:
  the module-level `openStack` plus `onKeydown`'s `openStack[openStack.length - 1] === this` guard
  is a correct, minimal way to ensure only the topmost open dialog's Tab trap fires; `#trapTab`'s
  edge detection (`atEdge || !focusable.includes(active)`) correctly covers the initial-open case
  (focus starts on the `tabindex="-1"` wrapper, excluded from `FOCUSABLE_SELECTOR`) as well as
  ordinary wraparound. Implementation matches the WAI-ARIA APG dialog pattern and is scoped
  exactly to the task (no inert-marking, no z-index/backdrop — correctly deferred as out of scope).

## Found and fixed during this review: TASK-004/TASK-005 integration incompatibility

Both tasks were scoped correctly and stayed within their file ownership — the task contracts
explicitly called out this risk (TASK-005's contract: "another parallel task is composing
`<dv-pagination>` ... keep that contract stable"; TASK-004's own handoff flagged it as verified
"by inspection only, not against TASK-004's actual code"). The *attribute/event* contract
(`data-page`/`data-total`/`data-size`, `dv:page`) did stay stable, exactly as required. What
neither task could see in isolation: TASK-005 changed `dv-pagination`'s **rendered DOM structure**
— the "Page X of Y" text moved from a single `aria-current="page"` element into a dedicated
`.dv-pagination-status` span, with `aria-current="page"` now on a small page-number button instead
(textContent just `"1"`, `"2"`, etc.), and new page-number buttons now sit between Previous/Next.
TASK-004's tests, written against the pre-TASK-005 DOM, asserted `[aria-current="page"]`'s text
equals `"Page 1 of 3"` and clicked `querySelectorAll('button')[1]` expecting it to be Next — both
assumptions broke once merged, surfacing as 3 failing tests
(`tests/unit/dv-data-table.test.js:166,192,211`) only visible on the 3-way merge, not on any
individual branch.

This is normal, expected integration risk for two tasks composing the same third component from
different sides — not a defect in either task's own scope. Fixed directly (not sent back to
either implementer, since the fix belongs to neither task's exclusive file ownership map, only to
the merge): updated the 3 affected assertions in `dv-data-table.test.js` to read
`.dv-pagination-status` for the status text and click `[aria-label="Next page"]` instead of an
index-based button lookup. Verified on the merged tree: **163/163 unit tests, 19/19 e2e tests,
lint clean, size gate passed (3352 B/4096 B, unchanged)**.

## Findings

| Severity | Location | Finding | Required action |
| --- | --- | --- | --- |
| Medium (integration) | `tests/unit/dv-data-table.test.js` | TASK-004's pagination assertions were written against pre-TASK-005 `dv-pagination` DOM | **Fixed** during this review on the integration branch, see above. |
| Info | `src/core/morph.js` (no change) | Composing a non-`<dv-outlet>` custom element directly in `template()` loses its self-rendered DOM on the next parent re-render | Not a bug — documented as a comment in `dv-data-table.js` by TASK-004. Worth carrying forward as a known pattern for future component composition; no action needed now. |
| Low | `src/components/dv-pagination.js` jump-to-page input | TASK-005 flagged: after a no-op clamp (e.g. typing an out-of-range number that clamps back to the current page), the input can show stale text since no re-render is triggered | Cosmetic only, not a correctness bug (never emits/navigates to a bad page). Not fixed — left as a documented minor follow-up, doesn't block merge. |

## Recommendation

All three branches are implementation-complete and individually verified. A ready-to-use
integration branch, `swarm/task-004-006-integration`, already contains all three merged plus the
CHANGELOG.md conflict resolution (routine multi-append conflict, resolved by keeping all three
entries) plus the `dv-data-table.test.js` reconciliation fix above — fully re-verified green
end-to-end (163 unit + 19 e2e tests, lint, size).

Recommended path: fast-forward/merge `main` to `swarm/task-004-006-integration` (or replay its 6
commits — 3 feature + 3 doc/fix — onto `main` in a merge commit) rather than merging each branch
separately and re-resolving the same CHANGELOG/test conflicts again. Then update
`docs/swarm/active-work.md` to mark all three Closed, matching last round's format.

Per swarm rule 6, only a human maintainer approves the actual merge to `main` — this review is a
recommendation, not an action. Nothing has been merged into `main`; it is untouched and still at
`e9d0001`.
