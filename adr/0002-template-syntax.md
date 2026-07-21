# ADR-0002: Template syntax

- **Status:** Accepted
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya + AI pair
- **Constitution links:** §1.3 (API design is design), §2.1, §6.2 (AI-agent predictability), §8.1
- **Depends on:** ADR-0001

## Context

Morph render (ADR-0001) needs a way to produce HTML strings that is ergonomic, safe by default,
and readable by both PHP-oriented developers and AI agents.

## Decision drivers

- Zero new syntax to learn; CSP-safe (no `eval`-style expression parsing).
- Safe-by-default interpolation (details in ADR-0003).
- Deterministic output for the positional morph.

## Decision

1. **`html` tagged template** is the only template mechanism:
   `` html`<p>${this.state.count}</p>` `` returns an opaque, trusted `HtmlString`.
2. **Interpolation rules** for `${value}`:
   - `HtmlString` → inserted as-is (nested templates; already escaped at creation — double
     escaping is impossible by construction).
   - `Array` → every item processed by these same rules and joined (lists via `.map()`).
   - `null` / `undefined` / `false` → `''` (conditionals via ternary or `&&`).
   - any other primitive → **escaped** (ADR-0003).
3. **No custom control-flow syntax** (`{#each}`/`{#if}` etc.): control flow is plain JS.
4. **Single directive:** `data-on:event="methodName"` (ADR-0004). There is **no `data-bind`** —
   interpolation replaces it (YAGNI).
5. **Boolean attribute rule** (the tag's one piece of deliberate magic): when an interpolation is
   the *entire* attribute value (`disabled="${x}"`) and the value is `false | null | undefined`,
   the attribute is omitted entirely; `true` emits the bare attribute name. Partial-value
   interpolations (`class="btn ${x}"`) are always emitted and escaped. Template convention:
   attribute values are always double-quoted.
6. **Whitespace is never trimmed** by the morph — both sides of a diff always come from `html`
   templates, so whitespace-only text nodes are deterministic; this keeps `<pre>`/`<textarea>`
   correct for free.
7. `template()` must return an `HtmlString`. SVG works because parsing goes through
   `<template>.innerHTML` (correct namespaces).

## Considered alternatives (rejected)

- `<template>` elements + cloning — markup not encapsulated in the component (Option A style).
- htm / JSX — external dependency (§8.4) and an extra dialect.
- lit-html — parts-based and larger; a dependency against §8.4 and the size budget.
- Custom `{#each}` parser — requires expression evaluation; CSP and complexity hard-no.

## Consequences

**Positive:** ~0.8 KB implementation; Svelte-adjacent ergonomics; fully greppable, deterministic
for AI agents.
**Negative / to manage:** boolean-attribute scanning is the one "smart" spot — isolated in
`html.js` and heavily unit-tested.
**Naming note:** the state factory is `initialState()` and the reactive accessor is `this.state`;
`state()` was avoided so the factory never collides with the accessor on the prototype.
