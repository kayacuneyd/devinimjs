# ADR-0023: Router guards, lazy targets, wildcard, `mount()` and `dv-link`

- **Status:** Accepted (amends [ADR-0012](0012-hash-router.md))
- **Date:** 2026-08-07
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §2.1 (YAGNI), §9.3 (budgets — the router stays out of `core.js`)
- **Fulfills:** roadmap §1.7

## Context

The CMS admin shell needs an SPA router: auth guards, code-split pages, nested sections and
declarative links. ADR-0012's router resolves matches only — no guards, no lazy loading, no
rendering convenience, no link handling.

## Decision drivers

- Hash routing stays (shared hosting, no `.htaccess` rewrites — roadmap ADR-002).
- Backward compatibility: plain routes must keep ADR-0012's synchronous dispatch.
- The router must not become a component renderer framework: `mount()` is a thin convenience.

## Decision

1. **Wildcard:** one trailing `*` per pattern (`/admin/*` → `params.wildcard`, also matches the
   bare prefix). Registered last, it is the not-found catch-all.
2. **Guards:** `router.beforeEach(fn)` (global, every navigation) and
   `add(pattern, target, { beforeEnter })`. Guards may be async. Verdicts: `false` blocks (the
   current route stays), a string redirects, anything else proceeds. Global guards run before
   per-route ones.
3. **Lazy targets:** a plain-function target is a loader — called once on first match, awaited,
   its result (or its `.default` export) cached as the target. Class constructors are detected
   via their `toString` and are never invoked.
4. **Sync fast path preserved:** routes without guards and lazy targets dispatch synchronously,
   exactly as ADR-0012 specified; guarded/lazy routes resolve through a token-guarded async
   pipeline (a newer navigation always wins).
5. **`mount(host, routeMap?)`:** renders the matched target into a container. Targets must be
   registered element tags (string) or `define()`d constructors (reverse-looked-up through the
   ADR-0006 registry). Params arrive as `data-param-*` attributes (`/posts/:id` →
   `data-param-id`, read with `this.str('paramId')` — the ADR-0005 attribute contract). Same-tag
   navigations update attributes in place; different tags replace the element; an unmatched
   hash clears the container.
6. **`bindRouterLinks(router, root?)`:** delegated clicks on `<a dv-link="/path">` call
   `preventDefault` + `navigate`. Modifier clicks, non-left buttons and `target!="_self"` keep
   native behavior.

## Considered alternatives (rejected)

- History API router — breaks on shared hosting without rewrite rules (roadmap ADR-002).
- A `<dv-router outlet>` component — framework-owned rendering contradicts ADR-0012's
  "components decide how a route is rendered"; `mount()` is the minimal 90% case instead.
- Explicit `lazy()` wrapper — noise; a bare function is unambiguous because constructors are
  detectable and data targets are never functions by convention.

## Consequences

**Positive:** the admin shell pattern from roadmap §2.8 works verbatim; lazy admin pages keep
first load small.
**Negative / to manage:** guards must not redirect to a path that matches themselves
(documented loop hazard); mixed sync/async dispatch timing is covered by
`tests/unit/router-app.test.js`.
