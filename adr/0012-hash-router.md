# ADR-0012: Hash-based micro-router

- **Status:** Proposed (decision deferred until a real project needs it — constitution §2.1)
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya + AI pair
- **Constitution links:** §2.1, §2.4
- **Depends on:** ADR-0001; listed as a post-MVP candidate in ADR-0010

## Context

The owner goal "quickly build web applications" eventually implies multi-view navigation on
shared hosting, where server-side routing rules (`.htaccess` rewrites) are often unavailable or
fragile. Hash routing (`#/path`) needs zero server cooperation.

## Sketch of the design space (not a decision)

- `createRouter({ routes, outlet })`: maps `#/users/42` patterns to component names or render
  functions; `hashchange` listener; param extraction (`:id`); optional `<dv-link>` or plain
  `<a href="#/...">`.
- Open questions: nested routes? scroll restoration? navigation guards? lazy module loading per
  route (`import()` on demand — works build-free)? How are route params surfaced to components
  (`data-*` written by the router, mirroring ADR-0005)?
- Size estimate: ~1–1.5 KB as an optional module (`dist/modules/dv-router.js`), NOT in core —
  applications that need it opt in; pages that don't pay nothing.

## Why deferred

No real consumer yet. The store (ADR-0011) was earned by an immediate cross-component need; the
router has no such proof. When a real project needs it, this ADR is filled out (drivers,
options, decision) and implemented with tests + examples.
