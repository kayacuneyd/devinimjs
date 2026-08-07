# ADR-0011: Shared store (cross-component state)

- **Status:** Accepted
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §2.1 (YAGNI), §9.3 (budgets)
- **Depends on:** ADR-0001; fulfills the first post-MVP candidate of ADR-0010

## Context

The project's stated goal includes quickly building web *applications* — where state routinely
spans multiple components (cart count in the header + cart list in the page). Today the only
channel is DOM events (`dv:*`), which forces manual plumbing for shared data.

## Decision drivers

- Minimal addition: reuse the existing reactive + batching machinery.
- Predictable API: one creation function, one wiring method.
- Keep the 4 KB core budget.

## Decision

1. **`createStore(initialState)`** (new `core/store.js`) returns `{ state, subscribe }`:
   `state` is the same kind of reactive proxy components use; `subscribe(fn)` registers a
   listener (`fn(path)`) and returns an unsubscribe function. No actions/getters/middleware —
   YAGNI.
2. **Stores live in plain modules** (`store/cart.js`) and are imported wherever needed.
   No registry, no injection, no DOM-context magic.
3. **`BaseComponent.useStore(store)`** subscribes the component and auto-unsubscribes on
   disconnect. Any store change schedules a re-render via the existing microtask batching.
4. **`BaseComponent.requestUpdate()`** (new public method) schedules a render without a state
   change; `updated()` receives `['<external>']` for such batches. This is the escape hatch for
   any external data source (stores, timers, sockets…).
5. **Coarse re-render granularity by design:** any store change re-renders subscribed
   components (morph still patches only real diffs). Selector-based subscriptions are a
   documented future candidate, to be earned by measurement (§9.1).

## Considered alternatives (rejected)

- Events-only cross-component state — manual plumbing, easy to get wrong; the store removes it.
- A context/dependency-injection mechanism — needs DOM-tree plumbing and lifecycle complexity
  far beyond the problem.
- Third-party state library — dependency against §8.4 and the size budget.

## Consequences

**Positive:** application-scale state with ~25 lines of core; the Svelte-like authoring story
extends across components.
**Negative / to manage:** core grows slightly (verified by the size gate); stores are global
per module — documented that server-rendering/multi-app isolation is out of scope (no SSR).
**Known limitation:** re-attaching an element after a DOM move does not re-subscribe (the
existing "no re-initialization on move" rule); documented in `docs/architecture.md`.

## Amendment (2026-08-07, TASK-021)

Three compact helpers joined the store object for the CMS roadmap (§1.4), measured at
+272 B min+gzip against the 4 KB core budget (4065/4096 B after the change):

- **`set(key, value)`** — top-level key assignment with a prototype-pollution guard (§8).
  Dot-path setting was deliberately dropped (YAGNI: the roadmap only uses top-level keys).
- **`update(recipe)`** — the recipe may mutate `state` directly or return a partial object
  whose top-level entries are assigned (`store.update((s) => ({ count: s.count + 1 }))`).
- **`persist(key, { storage? })`** — hydrates the store from Web Storage on call (saved
  entries merge over initial state via `update`, so pollution keys are filtered), then writes
  through on every change; storage/serialization failures warn instead of throwing. Returns a
  dispose function.

Additionally `useStore(store, paths)` (path-filtered subscriptions, including parent-path
replacements) landed with the base-component cleanup work of the same roadmap round.
