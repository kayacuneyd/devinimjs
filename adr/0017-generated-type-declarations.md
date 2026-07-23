# ADR-0017: Generated `.d.ts` type declarations

- **Status:** Accepted
- **Date:** 2026-07-23
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §2 (simplicity/YAGNI), §9 (performance budget), DevinimJS build-free
  boundary rules 1 and 4

## Context

DevinimJS ships no type declarations. Editors and AI coding agents consuming
`import { BaseComponent } from 'devinimjs'` get no autocomplete or type-checking — they see
`any` everywhere. `docs/roadmap.md` flags this as P0 specifically because AI agents lean on type
hints to produce correct output, and the codebase already carries dense, consistent JSDoc
(ADR-0010 listed `.d.ts` typings as a deliberate post-MVP candidate). The MVP scope (ADR-0010)
explicitly deferred this; this ADR is that deferred decision.

The constraint is DevinimJS's core identity: a build-free, plain-ESM runtime for shared hosting
(constitution's build-free boundary, rules 1–7). Any solution that requires consumers to run a
compiler, or that turns the library itself into a TypeScript project, would contradict that
contract.

## Decision drivers

- Zero runtime cost and zero new runtime dependency — `constitution.md` rule 1.
- Low ongoing maintenance drift — hand-written `.d.ts` files silently rot as `src/` changes.
- The existing JSDoc is already the closest thing DevinimJS has to a type source of truth
  (`eslint-plugin-jsdoc` already enforces `@param`/`@returns` on public members), so it should be
  reused rather than duplicated.
- Bounded effort: the goal is a useful public-API surface, not full `strict` TypeScript
  compliance across the whole codebase.

## Considered options

### Option A — Hand-written `.d.ts` files

Write and maintain `types/*.d.ts` by hand alongside `src/`.

Pros: full control over the exposed shape; no new devDependency.
Cons: guaranteed to drift from `src/` the first time someone changes a method signature and
forgets the twin file; doubles the review surface for every future PR touching the public API.
Rejected — violates the "low maintenance drift" driver directly.

### Option B — Migrate to TypeScript source

Convert `src/**/*.js` to `.ts`, compile to `.js` for distribution.

Pros: strongest possible type safety, single source of truth.
Cons: makes `typescript` (or a transpile step) load-bearing for every future change to `src/`,
contradicts the build-free/plain-ESM contract that lets a consumer copy `src/` straight onto
shared hosting and run it unmodified, and is a scale of change far beyond what a P0 gap-filling
task should attempt. Rejected — contradicts the build-free contract this project exists to prove
(constitution's DevinimJS build-free boundary, rule 2).

### Option C — Generate `.d.ts` from existing JSDoc via `tsc --emitDeclarationOnly`

Add `typescript` as a **devDependency only** (never imported at runtime); use
`allowJs + checkJs + declaration + emitDeclarationOnly` to emit `types/` from the JSDoc that
already exists in `src/`, mirroring `package.json`'s `exports` map.

Pros: single source of truth stays the JSDoc in `src/`; runtime is untouched; declarations
regenerate automatically as `src/` changes; `checkJs` doubles as a lightweight JSDoc-accuracy
linter during development, at no cost to consumers who never install `typescript`.
Cons: JSDoc has to be reasonably precise for `tsc` to infer useful types (see Consequences); a
generation step must run before publishing and be guarded by a regression check so it doesn't
silently start emitting empty/broken output.

**Chosen: Option C.**

## Decision

- `typescript` is a `devDependency` only (`^5.9.3`, pinned to the stable 5.x line rather than the
  current `7.x` line — a native-compiler major rewrite is too large a surface to validate blind
  in a bounded task; revisit the pin in a future task once 7.x's JS/JSDoc-checking behavior is
  well understood). It is never imported by any file under `src/`.
- `tsconfig.json` at the repo root: `allowJs: true`, `checkJs: true`, `declaration: true`,
  `emitDeclarationOnly: true`, `outDir: types`, `noEmitOnError: false`. `checkJs` stays on
  (rather than being switched off to silence noise) because it materially improves declaration
  accuracy and gives maintainers a standing signal about JSDoc gaps in their editor — see
  Consequences for the specific gaps this surfaced and deliberately left unfixed in this task.
- `scripts/build-types.mjs` runs `tsc` and then verifies (plain Node assertions, no test
  framework) that the required output files exist and contain their expected exported symbols.
  A `tsc` exit code reflects any checkJs diagnostic anywhere in `src/`, including
  implementation-internal lines that never reach the public API surface; treating that as a hard
  failure would block shipping working, accurate public declarations over cosmetic internal
  gaps, so the script treats those diagnostics as advisory (logged, counted) and gates only on
  the declaration artifacts that matter.
- `npm run build:types` is wired into `npm run build` (so a single command produces both `dist/`
  and `types/`) but is **not** added to `npm run verify` — see Consequences for the measurement.
- `package.json`'s `"types"` field and every `"exports"` entry's `"types"` condition point at the
  generated output, mirrored 1:1 with the existing `default` targets.
- `types/` is committed, the same way `dist/` is (ADR-0007) — it is a published artifact, not a
  build cache.

## Consequences

**Positive:** `import { BaseComponent } from 'devinimjs'` now resolves to a real, richly
documented type in any TypeScript-aware editor or agent, generated from a single source of
truth that already existed and is already lint-enforced. No consumer ever installs `typescript`
or runs a compiler.

**Negative / to manage — known JSDoc looseness left unfixed in this task** (all internal,
non-public-API lines; declaration emission for the public surface is unaffected because
`noEmitOnError: false` and these lines are implementation details, not exported signatures):

- `src/core/component.js`'s `component()` factory config (`state`, `sync`, `actions` functions)
  has no `this` context modeled — `tsc` cannot infer that `this` inside those functions is the
  live component instance, so components authored with the `component()` factory (currently
  `dv-counter.js`, `dv-search.js`) show `checkJs` diagnostics on `this.state`/`this.props`
  accesses inside their own config objects. Fixing this needs a `ThisType`-based generic on
  `component()`'s JSDoc type — real work, out of this task's file-ownership boundary
  (`src/core/component.js` is not in TASK-002's exclusive-write list) and scope (no wholesale
  JSDoc rewrites). Flagged for a follow-up task.
- `src/core/base-component.js` and `src/core/morph.js` use intentionally-generic DOM types
  (`Node`, `Element`, `EventTarget`, `ChildNode`, `ParentNode`) on a few internal, private-method
  local variables where the runtime logic actually narrows further (e.g. an `Element` that is
  really an `HTMLInputElement`, an `EventTarget` that is really a `parentElement`-bearing node).
  `checkJs` correctly flags the mismatch; the public class members these methods serve
  (`BaseComponent`'s documented API) are unaffected. Worth a follow-up precision pass.
- `src/components/dv-cart.js` defines an action named `remove(id)`, which `checkJs` caught as
  incompatible with the inherited `Element.prototype.remove()` (0-arg) — a genuine naming
  collision between a component action and a built-in DOM method, surfaced as a side effect of
  this task. Not a declarations problem; worth its own bug ticket outside TASK-002's scope.
- `src/components/dv-dropdown.js`, `dv-modal.js`, `dv-tabs.js` each have one or two lines
  assuming a narrower element type (`.focus()`, `.tabIndex`, `.hidden`) than their local JSDoc
  declares.

None of the above blocks the acceptance bar: `types/core/core.d.ts`, `types/core/authoring.d.ts`,
`types/core/app.d.ts` and `types/core/base-component.d.ts` all generate cleanly with the expected
symbols and no `any` leakage on the primary public API, verified by
`tests/unit/type-declarations.test.js` and `scripts/build-types.mjs`'s own file/symbol gate.

**Follow-ups:** a future task to add `ThisType` modeling to `component()`'s config, and a
precision pass narrowing the DOM types called out above — both explicitly out of scope here per
the task's own non-goals (no wholesale JSDoc rewrites, no chasing full `strict` compliance).
