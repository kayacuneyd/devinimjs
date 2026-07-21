# ADR-0004: Event model

- **Status:** Accepted
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya + AI pair
- **Constitution links:** §8.1, §2.1 (YAGNI), §1.3
- **Depends on:** ADR-0001, ADR-0002

## Context

Morph render re-creates parts of the DOM. Per-node listeners would be lost on every render and
would leak. Inline expression handlers (Alpine-style) require `eval` — forbidden by ADR-0003.

## Decision

1. **Declarative binding:** `data-on:click="increment"` — the attribute value is a *method name*
   on the component class. No expressions, ever.
2. **Root delegation:** each component keeps **one listener per event type on itself**. Handlers
   are resolved at dispatch time, so re-rendering can never lose a listener.
3. **Type discovery:** the rendered template string is scanned with
   `/data-on:([\w:.-]+)=/g` after every render; additionally, outlet content (which carries no
   template string) is scanned from the DOM once, at placement time (ADR-0009). Missing types
   are added to the root idempotently.
4. **Handler signature:** `method(event, el)` — `this` is the component instance; `el` is the
   element carrying the directive, resolved by **walking up from `event.target` to the host
   boundary** with an attribute match (so clicks on children, e.g. icons inside a button, work).
   A manual walk is used instead of a dynamic attribute selector: `data-on:type` names contain
   colons, and selector-escaping behavior differs between engines (caught by E2E, 2026-07-21).
5. **Ownership rule (nested components):** a component handles an event only if the directive
   element belongs to its own render scope — walking up from the directive element, `this` must
   be reached *before* any other custom element (`tagName` containing `-`), with `<dv-outlet>`
   exempted (it is a transparent framework wrapper, see ADR-0009). The innermost component that
   owns the directive wins; outer components skip it.
6. **No modifiers in v0.1** (`.prevent`, `.stop`, …): call `event.preventDefault()` explicitly in
   the method (YAGNI; a future candidate).
7. **Outbound events:** `this.emit('save', detail)` dispatches a bubbling, composed
   `CustomEvent` named `dv:save`. Consumers (PHP pages, vanilla JS, or parent components via
   `data-on:dv:save`) listen natively. Namespace: `dv:*`.
8. **Update batching:** state mutations schedule one render per microtask; `updated(changedKeys)`
   receives the deduplicated root keys changed in that batch.
9. **Lifecycle hooks (optional overrides):** `connected()`, `disconnected()`,
   `updated(changedKeys)`, `onAttribute(name, newValue, oldValue)`.

## Considered alternatives (rejected)

- Per-node `addEventListener` after each render — lost nodes, cleanup burden, memory leaks.
- Inline expressions in attributes — `eval`, CSP violation, injection risk (§8.1).
- Full modifier system — premature for v0.1.

## Consequences

**Positive:** render-proof listeners; CSP-safe; nested components compose without cross-talk.
**Negative / to manage:** the ownership walk is subtle — covered by dedicated unit tests
(including `<dv-outlet>` exemption and nested-component cases).
