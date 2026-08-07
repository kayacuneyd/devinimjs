# ADR-0026: Dev-only debug hook (`__DEVINIM_DEBUG__`)

- **Status:** Accepted
- **Date:** 2026-08-07
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §9.3 (budgets), §2.1 (YAGNI)
- **Fulfills:** roadmap §1.12 (DevTools integration part)

## Context

The roadmap asks for a DevTools surface: component tree, store state, active subscriptions in
the console. A full DevTools extension is out of scope; the pragmatic 90% is a well-known
global with snapshot functions.

## Decision

1. **`installDebug(host?)`** (new `core/debug.js`) sets `window.__DEVINIM_DEBUG__` to
   `{ tags(), components(), stores() }`: registered element tags (ADR-0006 registry), live
   component instances with JSON state snapshots, and every created store's state.
2. **Opt-in and dev-only:** the module is deliberately absent from the `core/core.js` barrel
   (ADR-0019 precedent); apps import it explicitly behind a hostname/DEV check. The
   introspection state it reads (registry map, live-instance set, store set) costs the core
   bundle ~100 B gzip — measured via `npm run size`.
3. **Snapshots, not live references:** `components()`/`stores()` return JSON round-tripped
   copies (`'[unserializable]'` on failure) so console poking can never mutate app state.
4. Hot reload (the other half of roadmap §1.12) is **not** implemented: file watching requires
   a dev server, which the build-free/shared-hosting boundary (constitution) explicitly
   excludes. Documented as a deferred candidate.

## Considered alternatives (rejected)

- A browser-extension DevTools panel — build tooling and store publishing for zero runtime gain.
- Always-on global — gratuitous production surface; opt-in keeps the guarantee.

## Consequences

**Positive:** `__DEVINIM_DEBUG__.components()` answers "what is mounted with what state" in any
console today.
**Negative / to manage:** the internal getters are public-by-module but undocumented API —
they may change between minors.
