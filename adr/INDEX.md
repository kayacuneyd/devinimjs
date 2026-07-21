# ADR Index — DevinimJS

Architecture Decision Records for DevinimJS. New decisions: copy `_template.md`, assign the next
sequential number, register here.

| # | Title | Status | Date |
|---|-------|--------|------|
| [0001](0001-render-hydration-strategy.md) | Render & hydration strategy (morph render) | Accepted | 2026-07-21 |
| [0002](0002-template-syntax.md) | Template syntax (`html` tagged template) | Accepted | 2026-07-21 |
| [0003](0003-escaping-xss-policy.md) | Escaping & XSS policy | Accepted | 2026-07-21 |
| [0004](0004-event-model.md) | Event model (delegated `data-on:*`) | Accepted | 2026-07-21 |
| [0005](0005-attribute-state-contract.md) | Attribute ↔ state contract | Accepted | 2026-07-21 |
| [0006](0006-naming-registry.md) | Naming conventions & registry | Accepted | 2026-07-21 |
| [0007](0007-distribution-versioning.md) | Distribution & versioning | Accepted | 2026-07-21 |
| [0008](0008-testing-strategy.md) | Testing strategy (build-free consumer, tooled dev) | Accepted | 2026-07-21 |
| [0009](0009-composition-children-outlet.md) | Composition via `<dv-outlet>` | Accepted | 2026-07-21 |
| [0010](0010-mvp-scope.md) | MVP scope | Accepted | 2026-07-21 |

## Dependency graph

```
0001 (root)
 ├── 0002 template syntax
 ├── 0003 escaping / XSS
 ├── 0004 event model
 └── 0009 composition / outlet
0005 attribute↔state ─┐
0006 naming/registry   │ independent
0007 distribution      │
0008 testing           │
0010 MVP scope        ─┘
```
