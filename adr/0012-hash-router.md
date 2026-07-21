# ADR-0012: Hash-based micro-router

- **Status:** Accepted
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §2.1, §2.4
- **Depends on:** ADR-0001; listed as a post-MVP candidate in ADR-0010

## Context

The owner goal "quickly build web applications" eventually implies multi-view navigation on
shared hosting, where server-side routing rules (`.htaccess` rewrites) are often unavailable or
fragile. Hash routing (`#/path`) needs zero server cooperation.

## Decision

- `createHashRouter()` maps `#/users/42` patterns to arbitrary application targets and emits
  `{ path, params, target }` route objects through `subscribe()`.
- It only resolves routes. Rendering, route guards, scroll restoration and lazy imports remain
  application concerns, preserving a small and predictable API.
- Parameter extraction uses `:name`; route parameters are URI-decoded.
- The router is a plain ES module with no server rewrite, bundler or runtime dependency.

## Consequences

Hash routing works on ordinary shared hosting and static hosts. Applications that require
history routing, nested layouts or route-level code splitting can compose those concerns on top
without making them mandatory for every DevinimJS page.
