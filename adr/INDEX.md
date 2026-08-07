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
| [0011](0011-shared-store.md) | Shared store (cross-component state) | Accepted | 2026-07-21 |
| [0012](0012-hash-router.md) | Hash-based micro-router | Accepted | 2026-07-21 |
| [0013](0013-named-outlets.md) | Named outlets (multi-slot composition) | Proposed | 2026-07-21 |
| [0014](0014-keyed-morph.md) | Keyed list morph (`data-key`) | Accepted | 2026-07-21 |
| [0015](0015-error-boundary.md) | Component error boundary (`onError`) | Accepted | 2026-07-23 |
| [0016](0016-starter-kit-cli.md) | Starter-kit scaffolding CLI | Accepted | 2026-07-23 |
| [0017](0017-generated-type-declarations.md) | Generated `.d.ts` type declarations | Accepted | 2026-07-23 |
| [0018](0018-transition-primitives.md) | Transition primitives (`awaitTransition`) | Accepted | 2026-07-24 |
| [0019](0019-i18n-locale-primitive.md) | i18n/locale primitive (`t`, `registerLocales`, `setLocale`) | Accepted | 2026-07-24 |
| [0020](0020-starter-kits.md) | Starter kits (CKCSS pattern + DevinimJS component compositions) | Accepted | 2026-07-24 |
| [0021](0021-api-client.md) | JSON API client (`createApi`) | Accepted | 2026-08-07 |
| [0022](0022-form-validation.md) | Rule-based form validation (`validate` + `createForm.validate`) | Accepted | 2026-08-07 |
| [0023](0023-router-guards-lazy-mount.md) | Router guards, lazy targets, wildcard, `mount()`, `dv-link` | Accepted (amends 0012) | 2026-08-07 |
| [0024](0024-app-i18n-catalog.md) | Application-level i18n catalog (`createI18n`) | Accepted (amends 0019) | 2026-08-07 |
| [0025](0025-authoring-prop-descriptors.md) | Authoring-API prop descriptors (`{ type, default, required }`) | Accepted | 2026-08-07 |
| [0026](0026-dev-debug-hook.md) | Dev-only debug hook (`__DEVINIM_DEBUG__`) | Accepted | 2026-08-07 |
| [0027](0027-ci4-cms-starter-kit.md) | CI4 + SQLite CMS starter kit (`kits/ci4-cms/`) | Accepted | 2026-08-07 |

## Dependency graph

```
0001 (root)
 ├── 0002 template syntax
 ├── 0003 escaping / XSS
 ├── 0004 event model
 │    └── 0015 error boundary
 └── 0009 composition / outlet
0005 attribute↔state ─┐
0006 naming/registry   │ independent
0007 distribution      │
0008 testing           │
0010 MVP scope         │
0011 shared store     ─┘
0016 starter-kit CLI — depends on 0007 distribution, 0010 MVP scope
0013 proposed (named outlets) — parked, see its file
0010 MVP scope ── 0017 generated type declarations (deferred post-MVP candidate, now delivered)
0004 event model ── 0014 keyed morph ── 0018 transition primitives (dv-modal, dv-toast,
  dv-toast-stack, dv-disclosure)
0005 attribute↔state ── 0019 i18n/locale primitive (dv-modal, dv-confirm, dv-cart)
0016 starter-kit CLI ── 0020 starter kits (--kit=admin-dashboard)
0011 shared store ── amended 2026-08-07 (set/update/persist helpers, useStore path filters)
0012 hash router ── 0023 guards/lazy/wildcard/mount/dv-link (amendment)
0019 i18n primitive ── 0024 app-level catalog createI18n (amendment)
0021 api client ── 0022 validation (shared HttpError.body.errors shape) ── 0027 CI4 CMS kit
0025 authoring prop descriptors (component() factory hardening)
0026 dev debug hook (reads 0006 registry + store registries)
0020 starter kits ── 0027 CI4 CMS kit (first server-backed kit)
```
