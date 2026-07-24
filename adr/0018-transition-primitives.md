# ADR-0018: Transition primitives (`awaitTransition`)

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §2.1 (YAGNI), §9.3 (performance budget), DevinimJS build-free boundary
  rules 1 and 4

## Context

`docs/roadmap.md` flagged a P1 gap: DevinimJS ships no animation/transition primitive anywhere
(`dv-modal`, `dv-toast`, `dv-toast-stack`, `dv-disclosure`), a visible polish gap versus
frameworks that ship one out of the box (e.g. Alpine's `x-transition`). All four components
today toggle visibility (or, for `dv-toast-stack`, array membership) synchronously — a
`hidden` attribute flips, or an item is spliced out of `state.items` — the instant the state
changes, with no way for a consumer's CSS transition to actually play before the element is
gone or hidden.

The hard constraint is `src/core/core.js`'s size gate: 4096 B min+gzip, sitting at 3352 B before
this task (~744 B of headroom) per ADR-0010's original budget. Any shared timing primitive
must not enter that budget.

## Decision drivers

- Genuinely new pattern (deferring a DOM/state change until an animation completes, or a
  timeout elapses) — warrants its own ADR per project convention (see ADR-0016/0017 for format).
- Zero size-budget cost to `core.js` — the primitive must be structurally excluded from what
  `npm run size` measures, not just small.
- Backward compatibility: a consumer who adds no CSS at all must see functionally the same
  instant show/hide as today — never a stuck or broken UI waiting on an event that never fires.
- Public API stability: attributes, `dv:*` event names, and the *timing* of those events must
  not change for existing consumers — only the DOM-presence teardown (the `hidden` attribute
  application, or the array splice) may be deferred.
- YAGNI (ADR-0010, §2.1): a minimal enter/exit timing primitive, not an animation engine — no
  easing curves, no keyframe sequencing, no spring physics.

## Considered options

### Option A — A generic `component()`-level animation config

Add a declarative `transition: {...}` option to component authoring (duration, easing, classes)
that the framework applies automatically.

Pros: no boilerplate per component.
Cons: real animation library scope (easing/keyframe config surface) that YAGNI explicitly rules
out for a project whose stated identity is a minimal, build-free runtime; would also need to be
core-adjacent to apply to every component, pressuring the size budget precisely where there is
the least room. Rejected.

### Option B — Pure declarative CSS (`@starting-style` + `transition-behavior: allow-discrete`)

Rely entirely on modern CSS to defer `display: none` and animate the starting/ending style,
with no JS-side waiting at all.

Pros: zero JS, arguably the most "web-platform-native" answer for the `hidden`-toggling
components.
Cons: does not solve `dv-toast-stack` at all — its items are removed from `state.items` and the
DOM outright (not toggled via `hidden`), so there is no attribute transition for the browser to
defer; the morph renderer's positional/keyed diff would delete the node before any paint. It
also silently depends on browser support consumers may not have audited, with no JS-side
timeout fallback — a consumer whose CSS quietly fails to apply anywhere (typo'd selector,
stripped stylesheet) gets a permanently-stuck removal instead of the graceful "eventually
resolves" behavior the roadmap gap calls for. Rejected as the sole mechanism, though its
absence is also why Option C's timeout fallback matters.

### Option C — A single JS primitive (`awaitTransition`), imported directly by components,
excluded from `core.js`'s export barrel

`awaitTransition(el, { timeout })` returns a `Promise<void>` that resolves on the element's own
`transitionend`/`animationend` (bubbled events from descendants are ignored), or after a
`timeout` (default 200ms), whichever comes first. Components call it to defer the final
DOM-presence change (`hidden = true`, or an array splice) until the exit transition — real or
absent — has finished.

Pros: solves all four components uniformly, including `dv-toast-stack`'s array-based removal
which Option B cannot touch; the timeout fallback makes "no CSS at all" behave correctly by
construction, not by convention; trivially excluded from the core budget by living outside
`core.js`'s export barrel — components `import { awaitTransition } from '../core/transition.js'`
directly, the same exclusion pattern already verified for TASK-004..006 component code (`npm
run size` only measures `core.js` and whatever it re-exports).
Cons: one JS module, one non-trivial invariant per component (state flips immediately;
DOM-presence teardown is deferred) that has to be applied correctly four times.

**Chosen: Option C**, combined with plain CSS `transition` rules in `themes/ckcss.css` (no
`@starting-style`/`allow-discrete`) for the reference exit animation — deliberately not Option
B's enter-side cleverness, to keep the initial ship minimal and avoid a second, less-tested
code path; a consumer wanting a symmetric enter fade can add `@starting-style` rules themselves
on top of the same `hidden` toggle, which is unaffected by this primitive.

## Decision

- New module `src/core/transition.js` exports one function, `awaitTransition(el, { timeout =
  200 } = {})`. It attaches `transitionend`/`animationend` listeners to `el` (filtered to
  `event.target === el`, so a descendant's own transition never resolves an ancestor's wait),
  races them against `setTimeout(timeout)`, and resolves — never rejects — on whichever comes
  first, tearing down every listener/timer it added.
- **Not** re-exported from `src/core/core.js`. Each of the four consuming components imports it
  directly from `../core/transition.js`. This mirrors the exclusion pattern already relied on
  by every component file (verified in TASK-004..006's review): `npm run size` bundles and
  measures only `core.js` and its export barrel, so a module no `core.js` export touches never
  enters that budget regardless of its own size. Confirmed empirically for this task: `npm run
  size` reports the identical `8368 B min, 3352 B min+gzip` before and after this change.
- Each of `dv-modal`, `dv-toast`, `dv-disclosure` gains a private, non-reactive `#visible` flag
  (decoupled from the public `state.open`) that drives the `hidden` attribute in `template()`,
  plus a `data-leaving` boolean attribute (present exactly while `#visible` is true and
  `state.open` is false) as the CSS hook for the exit animation:
  - **Opening/expanding/showing** is unchanged in timing: `state.open` flips, the `dv:open`/
    `dv:show`/`dv:toggle` event fires, and `#visible` is set `true` in the same synchronous
    call — `hidden` comes off in the very next render, exactly as before this primitive
    existed. There was no backward-compatibility pressure on this path (nothing downstream
    waits on the enter transition finishing), so it stays instant.
  - **Closing/collapsing/hiding**: `state.open` flips to `false` and its `dv:close`/`dv:hide`/
    `dv:toggle` event fires *immediately*, synchronously — unchanged from before. Only
    `#visible`'s flip to `false` (and therefore the `hidden` attribute's reapplication) is
    deferred behind `awaitTransition(el)`. A monotonically increasing per-instance token guards
    against a stale close resolving after a re-open superseded it (open while still fading out).
  - `dv-modal`'s existing focus-management logic (Tab-trap stack membership, returning focus to
    the recorded opener) stays tied to `state.open` in `updated()`, so it remains immediate —
    unaffected by the deferred `hidden` — matching the pre-existing, already-tested contract
    that focus returns to the opener right away, not after the fade completes.
- `dv-toast-stack` gains a `leaving: boolean` field on each item in `state.items` (initialized
  `false` in `show()`). `dismiss(id)` now: fires `dv:hide` immediately (unchanged timing),
  no-ops if the item is missing or already `leaving` (idempotency, extending the existing
  ADR-0015-era guard against duplicate `dv:hide`), sets `item.leaving = true` (keeping the item
  — and its `<output data-key="…">` element — mounted and rendered, now with `data-leaving`),
  and only *then* awaits `awaitTransition` on that item's element before actually filtering it
  out of `state.items`. Items also gained `data-key="${item.id}"` so the existing keyed-morph
  path (ADR-0014) — not the positional fallback — matches each item's DOM node stably across
  this now-longer-lived render sequence.
- `themes/ckcss.css` gains `transition: opacity …` (plus a small `transform` for `dv-toast`/
  `dv-toast-stack` items) and `[data-leaving] { opacity: 0; … }` rules for all four components'
  transitioning elements, plus a `.dv-disclosure-panel` class (previously unclassed) so CSS can
  target it. A `prefers-reduced-motion: reduce` media query zeroes every added `transition` —
  the primitive's timeout fallback already makes that behaviorally correct (WCAG 2.3.3).
  `dv-disclosure-panel`'s transition is opacity-only by design: an accurate block-size
  expand/collapse needs JS-measured `scrollHeight`, which is exactly the kind of scope this
  primitive is not (YAGNI).
- `dv-tabs` is explicitly **out of scope** for this task and untouched. Its panel switch
  crossfades between two panels that are *both already mounted* (only `hidden`/`tabindex`
  differ) — an architecturally different problem (a mutual-exclusion crossfade, not an
  open/close pair) from what `awaitTransition` was built to defer. Forcing it into this
  primitive's shape within this task's time budget risked a worse fit than leaving it for a
  dedicated follow-up task that can design the crossfade problem properly.

## Consequences

**Positive:** all four named components get a real, testable exit transition wired through a
single ~500-byte primitive that never enters the size-gated core budget (verified: `3352 B`
min+gzip, unchanged). A consumer who ships zero CSS keeps working exactly as before within
`timeout` (default 200ms) of a close/dismiss — never a stuck or broken UI. `dv:*` event timing,
attribute names, and `state` shape are all unchanged for every existing consumer.

**Negative / to manage:**

- Closing/dismissing now takes up to `timeout` ms (200ms default, or less if a real
  `transitionend`/`animationend` fires first) before the element's `hidden` attribute reapplies
  or a toast-stack item leaves `state.items` — previously synchronous within the same
  microtask. Existing unit tests asserting the old synchronous-hidden/synchronous-splice
  behavior were updated (`tests/unit/dv-modal.test.js`, `dv-toast.test.js`,
  `dv-toast-stack.test.js`, `dv-disclosure.test.js`, and the `dv-toast-stack` smoke test in
  `tests/unit/atomic-components.test.js`) to dispatch a simulated `transitionend` where they
  need the old fast timing, mirroring what a real browser does when a transition genuinely
  finishes.
- Four call sites now each carry the "state flips immediately, DOM-presence teardown defers"
  invariant instead of one. Mitigated by keeping the same private-method shape
  (`#applyVisibility`/`#visible`/`#closeToken`) in each of the three `hidden`-toggling
  components, and the equivalent `leaving`/`data-key` shape in `dv-toast-stack`, so the pattern
  reads the same everywhere rather than four bespoke implementations.
- `dv-disclosure-panel`'s transition is opacity-only, not a true height expand/collapse — a
  cosmetic limitation, documented above and in the CSS comment, not a functional one.

**Follow-ups:** a dedicated task to design `dv-tabs`' panel crossfade (a different problem
shape — mutual exclusion between two already-mounted panels, not an open/close pair); a
possible future JS-measured height transition for `dv-disclosure` if real usage asks for it
(YAGNI-tagged, no ADR yet).
