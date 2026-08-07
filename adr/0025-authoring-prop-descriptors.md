# ADR-0025: Authoring-API prop descriptors (`{ type, default, required }`)

- **Status:** Accepted
- **Date:** 2026-08-07
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §3 (quality gates), §2.1 (YAGNI)
- **Fulfills:** roadmap §1.5

## Context

The `component()` factory inferred prop types from bare defaults (`props: { start: 0 }`). The
roadmap demands declared props — `start: { type: Number, default: 0, required: true }` — with
runtime validation whose failure mode is a *meaningful* message, not a bare `console.error`
nor a page-breaking throw.

## Decision

1. **Descriptor syntax:** a props entry is a descriptor when it is a plain object whose keys
   are all in `{ type, default, required }`. `type` is one of `String | Number | Boolean |
   Array | Object`; `default` must match the declared type; `required` is a boolean.
   Everything else keeps the legacy bare-default inference — full backward compatibility.
2. **Define-time validation:** malformed descriptors throw `TypeError` from `component()`
   with the exact prop and reason (fail fast, before any element connects).
3. **Runtime validation:** at connect and on every observed attribute change, a missing
   required attribute or an unconvertible value (`data-start="abc"` for `Number`) logs a
   `console.error` naming the tag, prop, attribute, expected type and received value. The
   default applies and the page keeps working — components must degrade, not detonate.
4. **Ambiguity escape hatch:** a JSON default that legitimately contains a descriptor key
   (e.g. `{ type: 'a' }`) adds any other key to be read as data; documented in the module.
5. `sync` hooks fire unchanged for descriptor props; `this.props` stays a frozen snapshot.

## Considered alternatives (rejected)

- Throwing on runtime mismatch — a CMS editor must never white-screen the public page.
- TypeScript-style interfaces at runtime — build-step thinking; descriptors are plain data.

## Consequences

**Positive:** authoring-API props now self-document and self-diagnose; the roadmap §1.5
counter example works verbatim.
**Negative / to manage:** the descriptor/JSON-default ambiguity heuristic is documented but
real — the escape hatch covers it.
