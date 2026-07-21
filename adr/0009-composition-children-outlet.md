# ADR-0009: Composition via `<dv-outlet>`

- **Status:** Accepted
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya + AI pair
- **Constitution links:** §1.2 (composable components), §2.1 (YAGNI), §2.4
- **Depends on:** ADR-0001, ADR-0002

## Context

Light DOM has no native `<slot>`, but composition is essential:
`<dv-card><p>server content</p></dv-card>` must survive the component's own `template()` render.

## Decision

1. **Capture on connect.** Before the first render, `BaseComponent` moves the element's existing
   child nodes into a `DocumentFragment`.
2. **Outlet element.** `this.outlet` returns `` html`<dv-outlet></dv-outlet>` `` — placing it in
   `template()` marks where captured children live.
3. **Transparent wrapper.** On first render the captured fragment is appended into the
   `<dv-outlet>` element, which is styled `display: contents` (set from JS; structural, not
   design — constitution §1.4 does not apply to structural resets).
4. **Morph exemption.** The morph algorithm syncs the `<dv-outlet>` element itself but **never
   recurses into it** — the outlet subtree belongs to the consumer, not to `template()`.
5. **Nested islands are free.** A DevinimJS component inside an outlet upgrades independently and
   manages only its own subtree; the event-ownership rule (ADR-0004) exempts `<dv-outlet>` so
   directives in outlet content delegate to the outlet's owner.
6. **No named slots in v0.1** (`<dv-outlet name="header">` + `data-slot` is a documented future
   candidate; YAGNI).
7. **No outlet, no children:** if `template()` omits `${this.outlet}`, captured children are
   dropped (a dev-time `console.warn` fires once).

## Considered alternatives (rejected)

- Shadow DOM slots — forbidden by PROJECTIDEA (Light DOM constraint) and would break CKCSS
  inheritance.
- Comment-node placeholder (`<!--outlet-->`) with head/tail positional morph — workable but
  significantly more intricate than one morph exemption rule.
- Leaving children in place and rendering "around" them — node-moving complexity without a win.

## Consequences

**Positive:** slot-like ergonomics with ~15 lines of machinery; nested components just work.
**Negative / to manage:** `<dv-outlet>` appears in the DOM (harmless unknown element;
`display: contents` neutralizes layout impact); named slots deferred.
