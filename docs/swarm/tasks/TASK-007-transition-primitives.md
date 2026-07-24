# Task: TASK-007 — Animation/transition primitives (`dv-modal`, `dv-toast`, `dv-toast-stack`, `dv-disclosure`)

## Goal

Close `docs/roadmap.md` P1: DevinimJS ships no animation/transition primitives anywhere, a visible
polish gap versus Alpine's built-in `x-transition`. Add a minimal, opt-in transition primitive and
wire it into the four components the roadmap names: `dv-modal`, `dv-toast`, `dv-toast-stack`,
`dv-disclosure`. `dv-tabs`' panel switch is architecturally different (crossfade between two
always-present panels, not an open/close) — attempt it only if it fits cleanly within this task's
time budget; if not, explicitly document why in the handoff and leave it as a follow-up rather than
forcing an awkward fit.

This is the only P1 task opened this round. The other remaining P1 item, i18n/locale-bundle,
touches nearly every component's default copy — including all four this task touches — so it
cannot run in parallel with this one under the swarm's file-ownership rule and is deliberately
deferred to its own round after this merges.

## Scope and non-goals

In scope:

- A small shared primitive for "wait for a CSS transition/animation to finish, with a timeout
  fallback for consumers who haven't defined any CSS transition" (so nothing ever hangs
  indefinitely waiting for an event that will never fire). Suggested shape: something like
  `awaitTransition(el, { timeout })` returning a `Promise<void>`, resolving on `transitionend`/
  `animationend` or the timeout, whichever comes first — but the exact API is your call; document
  the reasoning for whatever shape you pick.
- **Keep this primitive out of the size-gated core bundle.** `npm run size` only measures
  `src/core/core.js` and whatever it re-exports (verified during TASK-004..006's review — component
  files aren't in that budget). Put the new primitive somewhere `core.js`'s export barrel does
  **not** re-export (e.g. a module under `src/core/` that only component files import directly, or
  colocate it with the components that use it) — confirm with `npm run size` before/after that the
  gate number is unchanged, and say so explicitly in the handoff.
- Wire it into open/close (or show/hide, or expand/collapse) transitions for:
  - `dv-modal` — backdrop/dialog enter and exit.
  - `dv-toast` — show and auto/manual hide.
  - `dv-toast-stack` — each item's add and dismiss (list items entering/leaving, not just the
    stack container).
  - `dv-disclosure` — panel expand/collapse.
  In each case: the *public* behavior (attributes, events, timing of `dv:*` events, state shape)
  must stay backward compatible — a consumer who adds no CSS at all sees functionally the same
  instant show/hide as today (mediated by the timeout fallback), not a broken or stuck UI.
- Add real transition CSS rules to `themes/ckcss.css` for the classes your primitive toggles, as
  the reference implementation other consumers can copy or override.
- Write a new ADR (`adr/0018-transition-primitives.md`, register in `adr/INDEX.md`) — this is a
  genuinely new pattern (deferring a DOM/state change until an animation completes), not a trivial
  tweak, and the project's convention is one ADR per architectural decision (see ADR-0016/0017 for
  format).
- Update `design/component-library.md` (or wherever these components' contracts are documented —
  grep first) for the four touched components.

Out of scope:

- `dv-tabs` panel crossfade — attempt only if trivial given the primitive you build; otherwise
  explicitly defer (see Goal).
- Don't add a general animation *library* (easing curves, spring physics, keyframe sequencing) —
  this is a minimal enter/exit timing primitive, not an animation engine. YAGNI per §2.1.
- Don't touch any component other than the four named above, `themes/ckcss.css`, and whatever new
  primitive module you create.
- Don't touch `src/components/dv-tabs.js` even for a partial/experimental attempt if you decide
  not to ship it — leave it untouched rather than landing half-finished work.

## Acceptance criteria

- `npm test` passes with new tests covering: the primitive resolves on a simulated
  `transitionend`/`animationend`, the primitive resolves via its timeout fallback when no
  transition fires (simulating a consumer with no CSS), and each of the four components' open/
  close (etc.) still reaches its final state (`state.open`/equivalent, emitted `dv:*` events)
  correctly with the primitive wired in.
- `npx playwright test` passes — if practical, add or extend one e2e case that exercises a real
  transition in a real browser (Chromium via Playwright) for at least one component, since
  `happy-dom` (used by the unit suite) doesn't render real CSS transition timing.
- `npm run lint` clean.
- `npm run size` unchanged (3352 B/4096 B) — confirm explicitly, this is the primary risk for this
  task given how little headroom is left in the core budget.
- New ADR written and registered in `adr/INDEX.md`'s table and dependency graph.
- CHANGELOG entry under `[Unreleased]`.

## Inputs

- Relevant roadmap gap: `docs/roadmap.md` P1 — "No animation/transition primitives anywhere
  (modal, toast, disclosure, tabs) — Alpine ships `x-transition` out of the box; a visible polish
  gap."
- Read first: `src/components/dv-modal.js`, `src/components/dv-toast.js`,
  `src/components/dv-toast-stack.js`, `src/components/dv-disclosure.js`, `themes/ckcss.css`
  (existing `[hidden]`/display rules for these components — you're replacing abrupt hide with a
  transition-aware version), `adr/0016-starter-kit-cli.md` or `adr/0017-generated-type-declarations.md`
  for the ADR format, `adr/0010-mvp-scope.md` (YAGNI/budget culture).

## Roles and outputs

| Role | Owner | Output file | Depends on |
| --- | --- | --- | --- |
| Orchestrator | claude (this session) | `docs/swarm/tasks/TASK-007-transition-primitives.md` | — |
| Implementer | dispatched agent (isolated worktree) | `docs/swarm/handoffs/TASK-007-implementer.md` | — |

## Exclusive file ownership

| Path or glob | Sole writer | Branch/worktree |
| --- | --- | --- |
| `src/components/dv-modal.js`, `dv-toast.js`, `dv-toast-stack.js`, `dv-disclosure.js` | TASK-007 implementer | isolated worktree, branch `swarm/task-007-transition-primitives` |
| New transition primitive module (implementer's choice of path) | TASK-007 implementer | same |
| `tests/unit/dv-modal.test.js`, `dv-toast.test.js`, `dv-toast-stack.test.js`, `dv-disclosure.test.js` (or wherever their current tests live — grep first, some may be in `atomic-components.test.js`) | TASK-007 implementer | same |
| `themes/ckcss.css` | TASK-007 implementer | same |
| `adr/0018-transition-primitives.md`, `adr/INDEX.md` | TASK-007 implementer | same |
| `CHANGELOG.md` (append-only) | TASK-007 implementer | same |

No other task is open concurrently this round — full ownership of the above, no reconciliation
expected at merge.

## Gates

- [ ] Implementation verified (`npm run verify` green in the task's worktree)
- [ ] Handoff written with evidence and open questions (`docs/swarm/handoffs/TASK-007-implementer.md`)
- [ ] Orchestrator integration review complete
- [ ] Human merge approval received
