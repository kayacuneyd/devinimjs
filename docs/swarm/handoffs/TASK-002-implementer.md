# Handoff: TASK-002 — Implementer

## Status

Complete

## Inputs reviewed

- `docs/swarm/README.md` (swarm rules)
- `docs/swarm/tasks/TASK-002-type-declarations.md` (this task's contract)
- `docs/swarm/tasks/TASK-001-starter-kit-cli.md` and `docs/swarm/active-work.md` (to resolve the
  ADR numbering question up front, per the task's explicit instruction)
- `docs/roadmap.md` P0 item ("No `.d.ts` type declarations")
- `constitution.md` (build-free boundary rules 1–7)
- `adr/INDEX.md`, `adr/0010-mvp-scope.md` (ADR tone/structure reference), `adr/_template.md`
- `package.json` (`exports` map, scripts)
- `eslint.config.mjs` (JSDoc lint assumptions — `publicOnly`, `require-param`/`require-returns`
  as warnings, not errors)
- `scripts/build-dist.mjs`, `scripts/size-check.mjs`, `scripts/create-component.mjs` (style
  reference for a new `scripts/*.mjs`)
- `tests/unit/component-validator.test.js` (style reference for a `node:test` that shells out to
  a `scripts/*.mjs`)
- Every file under `src/core/`: `core.js`, `authoring.js`, `app.js`, `base-component.js`,
  `component.js`, `html.js`, `utils.js`, `registry.js`, `reactive.js`, `store.js`, `morph.js`,
  `async-state.js`, `fetch.js`, `form.js`, `router.js`, and `src/devinim.js`
- All 16 files under `src/components/*.js` (read to classify factory-pattern vs class-pattern
  usage while diagnosing `checkJs` output)

## Evidence and findings

**ADR numbering:** At task start, `adr/INDEX.md` in this worktree only went up to `0014` (no
`0015`/`0016` present — TASK-001's and TASK-003's worktrees are isolated and hadn't committed
their own ADRs yet). TASK-002's own task file explicitly assigns me `adr/0017-...` and TASK-001's
task file explicitly assigns it `adr/0016-...`, so I used **0017** as directed, with no observed
collision. Flagging per instructions: this is based on each task's *assigned* number, not on a
live merge-time scan across worktrees (which isn't possible from an isolated worktree) — the
orchestrator should re-check `adr/INDEX.md` for a real collision at integration time, since I
could not see TASK-001/003's actual commits from here.

**TypeScript version:** pinned `typescript@5.9.3` as a devDependency (not `^7.x`, which is
`latest` on the registry as of 2026-07-23 — a native-compiler major rewrite I have no working
knowledge of; picked the stable, well-understood 5.x line instead so `allowJs`/`checkJs`/
`declaration` behavior is predictable). Noted as a pin to revisit in ADR-0017.

**Commands run (final state, in order):**

```
$ npm run build:types
[build:types] running tsc (declaration emit only)…
... 36 error TS… lines (implementation-internal, see below) ...
[build:types] 36 pre-existing checkJs diagnostic(s) in implementation-internal code (not the
public API surface) — tracked as known gaps in adr/0017-generated-type-declarations.md.
Declaration emission still proceeded (noEmitOnError: false); verifying output below.
[build:types] OK — 4 required declaration file(s) verified.

$ npm run build       # build:types && build-dist.mjs, wired per task spec
... same as above, then ...
dist/core.min.js: 8269 B (3316 B gzip)
dist/authoring.min.js: 10558 B (3948 B gzip)
dist/app.min.js: 3320 B (1483 B gzip)
dist/devinim.min.js: 28916 B (8760 B gzip)
... (16 dist/modules/*.js lines) ...
dist/ built.

$ npm run lint
> eslint .
(clean, exit 0)

$ npm test
> node --test tests/unit/*.test.js
# tests 86
# pass 86
# fail 0
(includes the new tests/unit/type-declarations.test.js as test #86)

$ npm run size
core bundle: 8269 B min, 3316 B min+gzip (budget 4096 B)
SIZE GATE PASSED
```

`npm run test:e2e` was not run — Playwright browsers are not installed in this sandbox
(`~/.cache/ms-playwright` absent) and this task touches no runtime/DOM code, so it was judged
out of the critical path for this task's acceptance bar (lint/test/size, as the task file states
explicitly). Flagging for the orchestrator to run before merge if a full `npm run verify` is
required at integration time.

**`build:types` timing:** measured at ~2.1s standalone (`time npx tsc -p tsconfig.json`) and
~1.7–1.8s inside the regression test. Per the task's instruction ("do NOT add it to `verify`
unless it's fast; measure and say so"): it *is* fast, but I deliberately did not add it to
`npm run verify` — `verify`'s existing scope (lint + test + e2e + size) is a runtime-correctness
gate; type generation is a publish-time/DX concern layered on top, wired into `npm run build`
instead per the task's own instruction. The orchestrator can add it to `verify` too if desired;
the 2s cost would not meaningfully change the gate's runtime.

**Declaration quality check (acceptance criterion: "resolve to a real type, not `any`"):**
inspected the generated output directly — `types/core/base-component.d.ts` types every public
`BaseComponent` member precisely (e.g. `useStore(store: { subscribe: (fn: (path: string) => void)
=> () => void }, paths?: string | string[] | ((path: string) => boolean)): () => void`); the only
`any` in it is `detail?: any` on `emit()` and `fallback?: any` on `json()`, both of which are
genuinely `*` (unknown/JSON-shaped) in the source JSDoc — an accurate reflection of the API, not
a typing gap. `types/core/component.d.ts` (the `component()` factory, the "AI-first authoring"
entry point) likewise resolves to a full structural type for `tagName`/`config`, not `any`.

## Changed files (all within TASK-002's exclusive-ownership table)

- `tsconfig.json` (new) — `allowJs`, `checkJs: true`, `declaration`, `emitDeclarationOnly`,
  `outDir: types`, `noEmitOnError: false`, `include: src/**/*.js`.
- `scripts/build-types.mjs` (new) — runs `tsc`, treats checkJs diagnostics as advisory (logs +
  counts them), hard-fails only if a required declaration file/symbol is actually missing.
- `adr/0017-generated-type-declarations.md` (new) — decision record, including the full list of
  known JSDoc gaps left unfixed (see below).
- `adr/INDEX.md` — registered ADR-0017 (table row + dependency graph note).
- `CHANGELOG.md` — `[Unreleased]` entry.
- `package.json` — added `typescript` devDependency; added `"types"` field; added `"types"`
  condition to every `exports` entry (mirroring existing `default` targets, including the
  `./components/*` wildcard pattern); added `"types"` to the `files` array (so it publishes);
  added `"build:types"` script; wired it into `"build"` (`build:types && build-dist.mjs`).
- `package-lock.json` — regenerated by `npm install --save-dev typescript@5.9.3`.
- `tests/unit/type-declarations.test.js` (new) — the required regression check: force-deletes
  `types/`, runs `scripts/build-types.mjs`, asserts the 4 required `.d.ts` files exist and
  contain their expected exported symbols, and specifically asserts `BaseComponent#state`
  resolves to `object` (not `any`).
- `types/**/*.d.ts` (new, generated & committed — same policy as `dist/`, ADR-0007) — one `.d.ts`
  per `src/**/*.js` module; `types/core/core.d.ts`, `types/core/authoring.d.ts`,
  `types/core/app.d.ts` mirror the barrel re-exports exactly as required.
- `docs/swarm/handoffs/TASK-002-implementer.md` (this file).

No `src/**/*.js` file was edited — runtime behavior is untouched, `typescript` is not imported
anywhere under `src/`, and no `.js` file was converted to `.ts`.

## Open questions and risks

1. **`component()` factory has no `this` context modeled** (systemic gap, not a one-off): inside
   a `component()` config's `state`/`sync`/`actions` functions, `checkJs` can't infer that `this`
   is the live component instance, so `dv-counter.js` and `dv-search.js` (the only two components
   currently using the factory API, per a grep across all 16 `src/components/*.js` files) surface
   ~16 diagnostics on `this.state`/`this.props` accesses. This needs a `ThisType`-based generic
   added to `component()`'s JSDoc in `src/core/component.js` — real, scoped work, but that file is
   **not** in TASK-002's exclusive-write list, and the task's non-goals explicitly forbid
   wholesale JSDoc rewrites. Left as documented, tracked debt (ADR-0017 Consequences). Given
   `component()`/the authoring API is the newest and most actively-developed public surface, I'd
   suggest this becomes its own small follow-up task fairly soon — it's the one place where the
   generated types are meaningfully less useful than the rest of the public API.
2. **A handful of internal DOM-type narrowness gaps** in `src/core/base-component.js` and
   `src/core/morph.js` (private-method-local variables typed as generic `Node`/`Element`/
   `EventTarget`/`ChildNode`/`ParentNode` where the runtime logic assumes a narrower type like
   `HTMLInputElement`). Does not affect the public `BaseComponent` declaration (verified above),
   but would be a nice precision pass. Also present in `dv-dropdown.js`, `dv-modal.js`,
   `dv-tabs.js` (one or two lines each: `.focus()`, `.tabIndex`, `.hidden`).
3. **Real bug found, not a types problem:** `src/components/dv-cart.js` defines an action named
   `remove(id)`, which `checkJs` flagged as incompatible with the inherited native
   `Element.prototype.remove()` (0-arg signature) — `FactoryComponent.prototype.remove =
   action` (in `component.js`) silently shadows the DOM's built-in `.remove()` on every `DvCart`
   instance. This is outside TASK-002's scope entirely, but worth a bug ticket: anything that
   calls `someCartElement.remove()` expecting DOM removal will instead invoke the cart's own
   `remove(id)` action with `id === undefined`.
4. **ADR numbering not verified against a live cross-worktree merge** — see "ADR numbering"
   above. If TASK-001 or TASK-003 also landed on `0017` for some reason (shouldn't happen per
   their own task files, but I could not directly verify their committed state), the orchestrator
   will need to renumber at integration.
5. `npm run test:e2e` was not run in this environment (Playwright browsers not installed) — see
   Evidence section. Recommend the orchestrator runs a full `npm run verify` (not just
   lint/test/size) before recommending merge, per this task's own gate checklist item
   ("Implementation verified (`npm run verify` green...)").

## Next recipient

Orchestrator
