# ADR-0014: Keyed list morph (`data-key`)

- **Status:** Proposed (decision deferred — constitution §2.1, §9.1 measure-first)
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya + AI pair
- **Depends on:** ADR-0001, ADR-0002; reserves the `data-key` attribute (ADR-0005 #6)

## Context

The v0.1 morph is positional: list items patch index-by-index. Reordering, inserting at the
top, or sorting a list therefore rewrites every item's content instead of moving nodes — and
per-item DOM state (an open `<details>`, scroll position inside an item) is lost across
reorders.

## Sketch of the design space (not a decision)

- Opt-in per list: `<li data-key="${u.id}">`. When all siblings in a diff range carry
  `data-key`, the morph matches by key: move node → patch in place; unmatched new → insert;
  unmatched old → remove.
- Open questions: mixed keyed/unkeyed siblings (fall back to positional for the range)?
  Duplicate keys (last wins + dev warning)? Interaction with focus (moving a focused node must
  not blur it — same rule as positional morph)?
- Performance note: keyed matching is O(n) with a map — the win is correctness of node
  identity, not raw speed. Measure a real reorder-heavy UI before building (§9.1).

## Why deferred

Current components render small, append-only lists where positional morphing is correct and
cheapest. The first reorder/sort-heavy component earns this ADR.
