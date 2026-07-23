# Review: TASK-001, TASK-002, TASK-003 — orchestrator integration review

## Status

Approve, pending human merge decision on ordering and the bugs found below.

## Evidence reviewed

- All three implementer handoffs (`docs/swarm/handoffs/TASK-00{1,2,3}-implementer.md`).
- Direct `git diff main..<branch> --stat` on all three branches (not just the handoff summaries).
- **Found and fixed independently**: TASK-001 and TASK-002 both branched from a point 3 commits
  behind `main` (missing ADR-0015/error-boundary, `docs/roadmap.md`, and the swarm task
  contracts entirely — their diffs showed those files as deletions). Merged `main` into both,
  resolved conflicts in `CHANGELOG.md` and `adr/INDEX.md` (simple entry-ordering, no logic
  conflicts), re-ran full verification after each. TASK-003 had already self-corrected this via
  its own `git merge --ff-only main` before committing.
- Re-ran `npm run lint && npm test && npm run size` on each branch after catch-up, independently
  (not trusting the implementer's self-reported numbers):
  - TASK-001: lint clean, **96/96** tests, size 3352 B/4096 B gate passed.
  - TASK-002: lint clean, **91/91** tests, size 3352 B/4096 B gate passed. Ran `npm run
    build:types` directly — confirms the documented-as-advisory internal `checkJs` diagnostics
    (DOM-type narrowness in `morph.js`/`base-component.js`, `component()`'s missing `this`
    context) still surface as warnings but don't block emission; 4 required declaration files
    verified present.
  - TASK-003: lint clean, **137/137** tests, size 3352 B/4096 B gate passed (unchanged from
    baseline, as expected for a test-only branch).
- Spot-verified TASK-003's two "found, not fixed" bug claims directly against source, not just
  the handoff's description:
  - **Confirmed real** — `src/components/dv-field.js:49` uses unquoted
    `hidden=${!this.state.invalid}`. `src/core/html.js`'s boolean-attribute rule (ADR-0002 #5)
    only matches the quoted `attr="${value}"` form; the unquoted form falls through to plain
    string interpolation, so `false` renders as the empty string, producing the malformed
    fragment `hidden= role="alert"` — the parser reads this as `hidden="role"` plus a stray
    `alert=""` attribute. Net effect: a required field's validation message never becomes visible
    and never carries `role="alert"`. Pinned by a passing "KNOWN BUG" test in
    `tests/unit/dv-field.test.js`.
  - **Confirmed real, previously unknown** (surfaced independently by TASK-002's checkJs run, not
    TASK-003): `src/components/dv-cart.js`'s `remove(id)` action method shadows the native
    `Element.prototype.remove()`. Checked every `.remove()` call site in the repo
    (`src/core/morph.js:53,105`, several test files) — none currently call `.remove()` on a
    `<dv-cart>` element, so this is latent, not yet triggered in shipped code/tests. It would
    break silently if `dv-cart` ever appeared as a keyed-list item removed via `morph()`, or if a
    consumer called `cartEl.remove()` expecting native DOM detachment.
  - `dv-data-table`'s `String().localeCompare()` sort producing lexicographic order on
    numeric-looking columns (`[2,10,3]` → `['10','2','3']`) — confirmed by reading
    `dv-data-table.js`'s sort implementation; a real limitation, arguably by-design given
    ADR-0010's "small, already-loaded rows" MVP scope for this component, not necessarily a bug.

## Findings

| Severity | Location | Finding | Required action |
| --- | --- | --- | --- |
| High (a11y) | `src/components/dv-field.js:49` | Unquoted `hidden=${…}` breaks validation-message visibility and `role="alert"` | Not fixed by any of the 3 tasks (out of their file ownership). Recommend a small standalone follow-up fix — one-line change, already has a red/pinned test ready to flip green. |
| Medium | `src/components/dv-cart.js:39` | `remove(id)` shadows `Element.prototype.remove()` | Latent, not currently triggered. Recommend renaming the action (e.g. `removeItem`) in a follow-up, with a migration note in CHANGELOG since it's a public method name change. |
| Low / by-design | `src/components/dv-data-table.js` | String-only sort on numeric columns | Already tracked in `docs/roadmap.md` P1 as part of the broader data-table pagination/filtering gap; no immediate action. |
| None | Merge base drift (TASK-001/002) | Branches missed 3 main commits | Fixed during this review (merge commits on each branch, re-verified). |

## Recommendation

All three branches are implementation-complete, individually verified, and now consistent with
current `main`. Recommended merge order into `main` (to resolve the remaining `adr/INDEX.md` /
`CHANGELOG.md` append conflicts once, cleanly, in sequence rather than all at once):

1. TASK-001 (adds ADR-0016) — no dependency on the other two.
2. TASK-002 (adds ADR-0017) — will need one more small `adr/INDEX.md` conflict resolved (ADR-0016
   row) at this step, since its branch doesn't know about 0016 yet.
3. TASK-003 (test-only, additive) — lowest risk, no ADR/index changes, merges cleanly last.

The `dv-field.js` and `dv-cart.js` bugs are pre-existing defects uncovered as a side effect of
this work, not caused by it — none of the three branches are the right place to fix them
(explicitly out of each task's file ownership). They're real and worth fixing soon, especially
the `dv-field.js` one (accessibility-impacting, tiny fix, already has a pinned test).

Per swarm rule 6, only a human maintainer approves the actual merge to `main` — this review is a
recommendation, not an action.
