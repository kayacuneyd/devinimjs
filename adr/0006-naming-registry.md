# ADR-0006: Naming conventions & registry

- **Status:** Accepted
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya + AI pair
- **Constitution links:** §6.2 (AI-agent predictability), §2.2 (3-pass rule), §2.3

## Context

PROJECTIDEA requires autonomous AI agents to read the codebase and produce new components.
That demands strictly predictable names.

## Decision

1. **Framework tag prefix: `dv-`** (DevinimJS). Framework components: `<dv-counter>`, `<dv-tabs>`.
   Consumer components may use any hyphenated tag; `dv-` is reserved for this library.
2. **One file = one component**, with a 1:1:1 mapping:
   `src/components/dv-counter.js` → `class DvCounter extends BaseComponent` →
   `define('dv-counter', DvCounter)` at end of file.
3. **Explicit tag strings.** The tag is written out in `define()` — never derived from the class
   name — so every registration is greppable.
4. **Named exports only**, everywhere. No default exports.
5. **Registry:** `define(tagName, ctor)` from `core/registry.js` validates the name (must contain
   a hyphen), guards against double registration (warn + return existing), then calls
   `customElements.define`.
6. **Member naming:**
   - State factory: `initialState()`; reactive accessor: `this.state`.
   - Template: `template()`; event handlers: plain verbs (`increment`, `save`).
   - Lifecycle hooks: `connected()`, `disconnected()`, `updated(changedKeys)`,
     `onAttribute(name, newValue, oldValue)`.
   - Emitted events: `this.emit('change')` → `dv:change` (namespace `dv:*`, ADR-0004).
7. **Core module layout:** `src/core/{reactive,html,morph,base-component,registry,utils}.js`
   plus the `core.js` barrel. One responsibility per file (§2.3).

## Considered alternatives (rejected)

- Class-name → tag auto-derivation — less greppable, more magic.
- A component auto-registry that scans directories — requires a build step; forbidden.
- Prefix `ck-` — belongs to CKCSS; JS side gets its own identity.

## Consequences

**Positive:** component generation by AI agents is near-deterministic; onboarding is one
convention table long.
**Negative / to manage:** the `dv-` reservation must be respected by consumers — documented in
README and the PHP integration guide.
