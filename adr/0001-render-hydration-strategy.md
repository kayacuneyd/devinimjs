# ADR-0001: Render & hydration strategy

- **Status:** Accepted
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya + AI pair
- **Constitution links:** §1.1, §2.1, §2.4, §5 (waived — see below), §8.1, §9.2

## Context

`BaseComponent` must reflect Proxy-based state changes into the DOM. Constraints: Light DOM only
(no Shadow DOM), no build step, initial state from PHP-printed `data-*`, global CSS (CKCSS) must
apply, core < 4 KB, WCAG AA, predictable enough for AI agents to author components.

## Decision drivers

- SvelteKit-like authoring DX: state + template + behavior in one class (project owner's stated goal).
- Rapid web-application development: dynamic lists, conditionals, composition.
- Clean PHP contract and component encapsulation.
- Constitution §8.1 (XSS), §9.2 (LCP/CLS budgets), §2 (YAGNI).
- **Explicitly not a driver:** working without JavaScript / progressive enhancement of
  server-rendered content (owner decision, 2026-07-21). Constitution §5 is therefore waived for
  DevinimJS components; brochure/SEO content is expected to remain plain CKCSS + PHP.

## Considered options

### Option A — Hybrid hydration

PHP prints the element **and** its full inner markup; the component scans its light DOM once,
builds a `data-bind` binding map, and surgically updates bound nodes on state change.
Pros: works without JS, best LCP, tiny XSS surface. Cons: markup contract leaks into every PHP
call site (no encapsulation), dynamic lists need an invented `<template>` convention, component
authoring is split across PHP and JS — the opposite of the Svelte-like goal.

### Option B — Full morph render (chosen)

The component owns its markup: `template()` returns an HTML string; on any state change the
template re-renders and a small **morph** algorithm patches the existing DOM in place.
Pros: `UI = f(state)` single source of truth; lists/conditionals are plain JS; PHP only prints
`<dv-x data-...>` (perfect encapsulation); one authoring place per component. Cons: content is
absent without JS (accepted); requires an escaping discipline (→ ADR-0003) and a focus-preserving
morph (→ ADR-0002/0004).

### Option C — Pure fine-grained binding

Templates instantiated once; every state key bound to exact nodes; updates fully surgical.
Verdict: not an independent third path — its initial DOM must come from either PHP (collapses
into A) or a JS template (collapses into B with a different update mechanism). Shipping it as a
separate v0.1 mode would violate §2.4 (premature abstraction).

## Decision

**Option B — full morph render.** Components are authored as a single class with `initialState()`,
`template()` and methods. The update pipeline has a single entry point (`#scheduleUpdate`), so a
hydration mode (Option A) can be added later as a non-breaking MINOR release if a real need
emerges (§2.1: build what is needed, design so it can be extended).

## Consequences

**Positive:** Svelte-like DX without a compiler; lists/conditionals are free; PHP contract is
just `data-*`; predictable shape for AI agents.
**Negative / to manage:** no-JS/SEO trade-off documented as a principle ("DevinimJS renders
application UI, not brochure content"); XSS surface managed by ADR-0003; morph quality gates
focus/event preservation (ADR-0004 delegation makes listeners render-proof).
**Follow-ups:** ADR-0002 (template syntax), ADR-0003 (escaping), ADR-0004 (events),
ADR-0009 (composition).
