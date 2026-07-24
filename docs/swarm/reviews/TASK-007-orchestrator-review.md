# Review: TASK-007 — orchestrator integration review

## Status

Approve, pending human merge decision. Single task this round, no other branch to reconcile
against — cleanest review of the swarm so far.

## Evidence reviewed

- Implementer handoff (`docs/swarm/handoffs/TASK-007-implementer.md`).
- `git diff main..swarm/task-007-transition-primitives --stat`: 19 files touched, all within the
  task's exclusive-ownership map (the four named components, `themes/ckcss.css`,
  `src/core/transition.js`, its tests, `adr/0018-*`, `adr/INDEX.md`, `design/component-library.md`,
  `CHANGELOG.md`, generated `types/`). No file outside that map was touched.
- Re-ran the full pipeline **independently** in the task's own worktree, not trusting the
  implementer's self-reported numbers: `npm run lint` clean, `npm test` **174/174**, `npx
  playwright test` **21/21** (including both new `tests/e2e/transitions.spec.js` cases against
  real Chromium), `npm run size` → `8368 B min, 3352 B min+gzip` — **byte-for-byte identical** to
  the pre-task baseline (confirmed against TASK-004..006's post-merge number). This was the
  task's flagged highest-risk item and it holds.
- Read `src/core/transition.js` directly: `awaitTransition(el, { timeout = 200 })` is a single
  ~20-line function, resolves once (never rejects) on a `transitionend`/`animationend` fired
  directly on `el` (bubbled descendant events correctly excluded via `event.target !== el`) or the
  timeout, with proper listener/timer teardown on settle. No re-export from `core.js` — confirmed
  by reading `core.js`'s barrel, which is unchanged by this diff.
- Read `adr/0018-transition-primitives.md` in full: correctly frames the size-budget constraint as
  the hard driver, considers and rejects two real alternatives (a declarative animation-config
  option — correctly flagged as animation-library scope YAGNI rules out; pure
  `@starting-style`/`allow-discrete` CSS — correctly flagged as unable to solve `dv-toast-stack`,
  whose items leave the DOM outright via array splice rather than a `hidden` toggle) before
  landing on the shipped design. Matches the project's ADR rigor bar (ADR-0016/0017 format).
- Spot-checked `src/components/dv-modal.js`'s wiring: `state.open` and its `dv:open`/`dv:close`
  events still flip/fire synchronously and immediately on `close()` — only the private `#visible`
  flag (driving `hidden` in `template()`) is deferred behind `awaitTransition`. This is the
  correct backward-compatibility shape: existing consumers reading `state.open` or listening for
  `dv:close` see no timing change; only the DOM's `hidden` application is delayed. The existing
  focus-trap/opener-return/open-stack logic in `updated()` is keyed off `state.open`, not
  `#visible` — confirmed unchanged and still correct.
- Confirmed `dv-tabs.js` is untouched (`git diff main..HEAD -- src/components/dv-tabs.js` is
  empty) — the task's explicit "defer rather than force a bad fit" instruction was followed, and
  the reasoning (crossfade between two already-mounted panels is a different state-machine shape
  than an open/close pair) is sound and documented in ADR-0018's Consequences as a follow-up.

## Process note (not a code defect)

The implementer initially wrote `docs/swarm/handoffs/TASK-007-implementer.md` into the **main**
worktree instead of its own task worktree — the same mistake TASK-005's implementer made and
self-caught last round; this time it wasn't caught before the agent reported completion. Found
during this review (`git status` in the main worktree showed the file as untracked), fixed
directly: copied the file into the correct location inside the task's worktree, committed it
there (`cb46000`), and removed the stray untracked copy from main. Main worktree confirmed clean
before and after. No code impact — worth noting in case this becomes a recurring pattern worth a
sharper instruction in the task-template/README rather than relying on each implementer to
self-catch it.

## Findings

| Severity | Location | Finding | Required action |
| --- | --- | --- | --- |
| Info / process | n/a | Handoff file briefly misplaced in the main worktree | Fixed during this review (moved and committed to the correct branch). No recurring risk to `main` since it's caught at review time either way. |
| Low / documented limitation | `src/components/dv-disclosure.js` / `themes/ckcss.css` | Disclosure panel transition is opacity-only, not a true height expand/collapse (needs JS-measured `scrollHeight`) | Not fixed — correctly scoped out (YAGNI) and flagged in ADR-0018 as a future candidate. No action needed now. |
| None | `src/components/dv-tabs.js` | Panel-crossfade animation not attempted | Correctly deferred per task scope; flagged as a follow-up task, not a defect. |

## Recommendation

`swarm/task-007-transition-primitives` is implementation-complete, fully verified independently
(174 unit + 21 e2e tests, lint clean, size gate unchanged), and touches nothing outside its
ownership map. No integration conflicts to resolve — this is a straight merge to `main`, not a
multi-branch reconciliation like TASK-004..006.

Per swarm rule 6, only a human maintainer approves the actual merge to `main` — this review is a
recommendation, not an action. `main` is untouched.
