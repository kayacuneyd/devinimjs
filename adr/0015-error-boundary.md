# ADR-0015: Component error boundary (`onError`)

- **Status:** Accepted
- **Date:** 2026-07-23
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §2.1 (YAGNI), §3 (Quality gates), §9 (Performance)
- **Depends on:** ADR-0001 (render/morph strategy), ADR-0004 (event model)

## Context

An exception thrown inside `template()` (during `#render()`) or inside an action method (during
`#dispatch()`) currently has no containment. A render-phase throw escapes from inside the
`queueMicrotask` callback that drives re-renders after a state change; an action-phase throw
escapes from inside native event dispatch. Both surface only as an uncaught exception with no
consistent logging, no fallback UI, and — for a render-phase throw specifically — the component
is left in whatever half-updated DOM state `morph()` reached before the throw. This is a routine
failure mode (a bad prop value reaching an unguarded `JSON.parse`, an action assuming a store
entry exists), not a hypothetical one, so it is not YAGNI to address.

## Decision drivers

- Must not change default behavior for the ~16 shipped components or any existing consumer: an
  uncaught error today must still be exactly as visible after this change unless a component
  opts in.
- Must work identically for both authoring paths — the `BaseComponent` class API and the
  `component()` factory — without either one needing bespoke wiring.
- Must stay inside the < 4 KB min+gzip core budget (§9); the mechanism must be a few lines, not a
  subsystem.

## Considered options

### Option A — Rely on `window.onerror` / `window.onunhandledrejection`

A consumer can already listen globally. Rejected: not component-scoped (no access to `this`,
`phase`, or the ability to render a fallback for just the failing element), and it does not
distinguish a DevinimJS render/action failure from any other page error.

### Option B — Bespoke try/catch at every lifecycle call site with a different signal per site

Rejected: inconsistent (each site inventing its own contract) and harder to keep within the size
budget than a single hook.

### Option C — One `onError(error, phase)` hook, default no-op-that-rethrows, wrapping only
`#render()` and `#dispatch()`'s action invocation

Chosen. `phase` is `'render'` or `'action'`. The default implementation is `throw error;` — so a
component that does not override `onError` behaves exactly as before: the error still escapes and
is still reported as an uncaught exception with its original stack. A component that overrides
`onError` contains the error instead — it can render a fallback state, report to a monitoring
endpoint, or both.

## Decision

- `BaseComponent.prototype.onError(error, phase)` is added, mirroring the existing
  `updated(changedKeys)` / `onAttribute(name, newValue, oldValue)` optional-override pattern.
  Default body: `throw error;` (preserves current behavior).
- `#render()`'s body (the `template()` call through the morph/outlet/delegation steps) is wrapped
  in `try { … } catch (error) { this.onError(error, 'render'); }`. This covers both call sites
  that invoke `#render()` — the first render in `connectedCallback()` and every subsequent
  microtask-batched re-render in `#notify()` — without duplicating the wrapper.
- `#dispatch()`'s `this[method](event, el)` call is wrapped the same way, with `phase = 'action'`.
- The `component()` factory gains a matching `onError` config entry. It only assigns
  `FactoryComponent.prototype.onError` when `config.onError` is actually provided — exactly like
  the existing conditional assignment for `config.actions` entries — so a factory component with
  no `onError` in its config still inherits `BaseComponent.prototype.onError`'s rethrow default
  rather than silently swallowing errors.
- Not wrapped: `connected()`, `reconnected()`, `disconnected()`, `updated()`, `onAttribute()`,
  `prepare()`. These are lower-frequency, harder to meaningfully recover from mid-lifecycle, and
  adding them now would be scope creep past what motivated this ADR (§2.1) — a future ADR can
  extend `phase` to cover them if a real failure mode shows up there.

## Consequences

**Positive:** a component author can now contain a render/action failure (fallback UI, logging)
without every consumer needing a global `window.onerror` handler; default behavior for every
existing component is unchanged.
**Negative / to manage:** `onError` swallowing an error is now possible, so a careless override
(`onError() {}`) can hide a real bug silently — documented as the tradeoff of opting in; the
default is deliberately loud (rethrow) so silence requires an explicit choice.
**Follow-ups:** extending `phase` to lifecycle hooks (`connected`/`updated`/etc.) is a YAGNI-tagged
future candidate, not decided here.
