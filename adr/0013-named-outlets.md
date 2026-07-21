# ADR-0013: Named outlets (multi-slot composition)

- **Status:** Proposed (decision deferred — constitution §2.1)
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya + AI pair
- **Depends on:** ADR-0009

## Context

v0.1 composition (ADR-0009) supports a single default outlet: `${this.outlet}` receives all
initial children. Card-layout components (header/body/footer regions) or layouts with a sidebar
need multiple insertion points — the Light-DOM equivalent of named slots.

## Sketch of the design space (not a decision)

- Consumer marks children: `<dv-card><h2 data-slot="title">…</h2><p>body</p></dv-card>`.
- Template places `${this.outlet}` (default/unnamed) and `${this.outletFor('title')}` which
  renders `<dv-outlet name="title">`.
- Capture step distributes children by `data-slot` into per-name fragments; the morph
  exemption (ADR-0009 #4) already ignores all `<dv-outlet>` subtrees.
- Open questions: fallback content for empty named outlets? Duplicate slot names (first wins)?
  Does `data-slot` stay in the DOM (styling hook — probably yes)?

## Why deferred

`<dv-tabs>` and `<dv-counter>` ship comfortably on the single outlet. The first component that
genuinely needs regions (likely a `<dv-modal>` with title/actions) will earn this ADR.
