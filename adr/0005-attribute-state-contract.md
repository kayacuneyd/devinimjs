# ADR-0005: Attribute ↔ state contract

- **Status:** Accepted
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya + AI pair
- **Constitution links:** §1.3, §8.1
- **Depends on:** ADR-0001

## Context

PROJECTIDEA requires components to read their initial state from PHP-printed `data-*`
attributes. Attributes are always strings at the boundary; a coercion and live-sync contract is
needed.

## Decision

1. **Configuration arrives via `data-*`.** `data-page-size="10"` is natively available as
   `this.dataset.pageSize` (kebab→camel by the platform).
2. **Coercion helpers on `BaseComponent`:**
   - `this.str('title', '')` — string with fallback.
   - `this.num('start', 0)` — finite `Number`, else fallback.
   - `this.bool('open', false)` — presence-based; `'false'`/`'0'` are false.
   - `this.json('users', [])` — `JSON.parse` with try/catch + warning, else fallback.
   Helpers never return `HtmlString` (ADR-0003): attributes carry data, never markup.
3. **Initial read happens in `initialState()`**, which runs at connect time — never in the
   constructor (attribute access in constructors violates the Custom Elements spec).
4. **Live sync is explicit, not magical:** components that need it declare
   `static observedAttributes = ['data-start']` and implement
   `onAttribute(name, newValue, oldValue)` — typically a one-liner
   (`if (name === 'data-start') this.state.count = Number(newValue) || 0;`).
   Attribute changes that arrive before connect are ignored by design; `initialState()` already
   reads the current values.
5. **PHP printing contract:** `htmlspecialchars($value, ENT_QUOTES)` for scalars;
   `htmlspecialchars(json_encode($value), ENT_QUOTES)` for arrays/objects (full examples in
   `docs/guides/php-integration.md`).
6. **Reserved attribute namespaces:** `data-on:*` (events, ADR-0004) and `data-key`
   (reserved for a future keyed-morph list optimization — not implemented in v0.1, YAGNI).

## Considered alternatives (rejected)

- Automatic attribute→state reflection — magic that breaks down on coercion and naming; explicit
  beats implicit (§1.3, §2.2).
- Property-based (JS-only) configuration — useless for PHP/server rendering.

## Consequences

**Positive:** the PHP contract is one sentence long ("print the element with `data-*`"); all
coercion lives in tested helpers.
**Negative / to manage:** developers must remember `observedAttributes` — mitigated by the
component checklist in `CONTRIBUTING.md` and warnings in docs.
