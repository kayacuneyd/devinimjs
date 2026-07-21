# ADR-0014: Keyed list morph (`data-key`)

- **Status:** Accepted
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya
- **Depends on:** ADR-0001, ADR-0002; reserves the `data-key` attribute (ADR-0005 #6)

## Context

The v0.1 morph is positional: list items patch index-by-index. Reordering, inserting at the
top, or sorting a list therefore rewrites every item's content instead of moving nodes — and
per-item DOM state (an open `<details>`, scroll position inside an item) is lost across
reorders.

## Decision

- Opt-in per list: `<li data-key="${u.id}">`. When all direct element siblings on both sides
  carry a unique `data-key`, the morph matches by key: move node → patch in place; unmatched
  new → insert; unmatched old → remove.
- Formatting whitespace and comments are refreshed from the template and do not prevent keyed
  matching.
- Mixed keyed/unkeyed sibling ranges fall back to positional morph.
- Duplicate or missing keys emit a development warning and fall back to positional morph.
- Moving an existing node preserves its DOM-local state, including focus and nested custom
  element identity.
- Performance note: keyed matching is O(n) with a map — the win is correctness of node
  identity, not raw speed. Measure a real reorder-heavy UI before building (§9.1).

## Consequences

Keyed morph adds a small O(n) map only to opt-in sibling ranges. Unkeyed templates retain the
existing positional implementation and its size/performance characteristics.
