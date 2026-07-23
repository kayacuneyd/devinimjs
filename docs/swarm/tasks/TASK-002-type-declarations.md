# Task: TASK-002 — Generated `.d.ts` type declarations

## Goal

Publish accurate TypeScript type declarations for the public API surface, generated from the
JSDoc that already exists throughout `src/`, so editors and AI coding agents get real
autocomplete/type-checking without DevinimJS becoming a TypeScript project or gaining a
compile-time requirement for consumers. This is a P0 item in `docs/roadmap.md`, promoted there
specifically because AI agents lean on type hints to produce correct output.

## Scope and non-goals

In scope:
- Add `typescript` as a **devDependency only** (declaration emission needs it; runtime code stays
  dependency-free per `constitution.md`'s build-free contract — this must not be a runtime import
  anywhere).
- A `tsconfig.json` (or `jsconfig`-adjacent config) using `allowJs: true`, `checkJs` at whatever
  strictness the existing JSDoc actually supports without a wall of new errors (do not rewrite
  JSDoc across the codebase to satisfy `strict: true` — if `checkJs` surfaces real gaps, fix the
  specific JSDoc annotation, don't loosen types to hide it; note anything you deliberately leave
  loose in your handoff), `declaration: true`, `emitDeclarationOnly: true`.
- A new build step (`scripts/build-types.mjs` or a `tsc` invocation wired into
  `scripts/build-dist.mjs`) that emits `.d.ts` files mirroring the public `exports` map in
  `package.json` (`.` → core, `./authoring`, `./app`, `./components/*`).
- A new `"build:types"` npm script, and wire it into the existing `"build"` script (so
  `npm run build` produces both the minified `dist/` bundles and the type declarations in one
  command) — but do NOT add it to `"verify"` unless it's fast; measure and say so in the handoff.
- Point `package.json`'s `"types"` field (and per-export `types` conditions in the `exports` map)
  at the generated output.
- Because this adds a new devDependency and a new public contract (published types), write
  `adr/0017-generated-type-declarations.md` (check `adr/INDEX.md` for the next free number — if
  TASK-001 already claimed 0016, use 0017; if there's a numbering collision with a parallel task,
  say so in your handoff rather than guessing) and register it in `adr/INDEX.md`.
- A regression check that generation doesn't silently break: a test or `npm run` step that runs
  the type-generation and asserts a known export's `.d.ts` file exists and contains an expected
  symbol (e.g. `BaseComponent`) — plain Node assertions are fine, no new test framework.

Out of scope:
- Do NOT convert any `.js` source file to `.ts`. Do NOT change runtime behavior anywhere in
  `src/`. Do NOT add `typescript` (or anything else) as a runtime dependency.
- Do NOT attempt full `strict` TypeScript compliance across the whole codebase in this task —
  bounded goal is "types are generated and roughly correct for the primary public API," not "zero
  `any` anywhere." Flag any component/module whose JSDoc is too loose to produce a useful type as
  an open question rather than rewriting it wholesale.

## Acceptance criteria

- `npm run build:types` (or equivalent) produces `.d.ts` output for at least: `core.js`
  (`BaseComponent`, `html`, `define`, `createReactive`, `createStore`, `morph`, `safeUrl`,
  `HtmlString`, `unsafe`, `escapeHtml`), `authoring.js` (`component`), and `app.js` barrel exports.
- A consumer `import { BaseComponent } from 'devinimjs'` in an editor with TypeScript language
  support would resolve to a real type, not `any`.
- `npm run lint`, `npm test`, `npm run size` remain green (size gate must be unaffected — types
  are dev-time only, never bundled into `dist/*.min.js`).
- `adr/00XX-generated-type-declarations.md` exists, registered in `adr/INDEX.md`, states why
  generated-from-JSDoc was chosen over hand-written `.d.ts` (lower maintenance drift) and why full
  TS migration was rejected (contradicts the build-free/plain-ESM contract).
- CHANGELOG entry under `[Unreleased]`.

## Inputs

- Product/feature spec: `docs/roadmap.md` P0 — "No `.d.ts` type declarations."
- Relevant ADRs/docs: `constitution.md` (build-free contract, dependency discipline),
  `adr/INDEX.md` (next ADR number), `package.json` (`exports` map — the types output must mirror
  this exactly).
- Read first: `src/core/core.js`, `src/core/authoring.js`, `src/core/app.js`,
  `src/core/base-component.js` (JSDoc density/quality — this is your best-case sample),
  `eslint.config.mjs` (existing JSDoc lint rules — reuse their assumptions about doc style),
  `scripts/build-dist.mjs`.

## Roles and outputs

| Role | Owner | Output file | Depends on |
| --- | --- | --- | --- |
| Orchestrator | this session (claude) | `docs/swarm/tasks/TASK-002-type-declarations.md` | — |
| Implementer | dispatched agent (isolated worktree) | `docs/swarm/handoffs/TASK-002-implementer.md` | — |

## Exclusive file ownership

| Path or glob | Sole writer | Branch/worktree |
| --- | --- | --- |
| `tsconfig.json` | TASK-002 implementer | isolated worktree, branch `swarm/task-002-type-declarations` |
| `scripts/build-types.mjs` (or equivalent) | TASK-002 implementer | same |
| `adr/00XX-generated-type-declarations.md` | TASK-002 implementer | same |
| `adr/INDEX.md`, `CHANGELOG.md`, `package.json` (append-only, small edits) | TASK-002 implementer | same |
| Any new `tests/unit/type-declarations*.test.js` | TASK-002 implementer | same |

`package.json`, `adr/INDEX.md`, `CHANGELOG.md` are also touched by TASK-001 and TASK-003 in their
own worktrees — these are small, append-only edits in disjoint sections; the orchestrator resolves
the merge order and any conflicts by hand at integration time (see `docs/swarm/README.md` rule 4:
no two *code-writing* agents share an implementation path — these three shared docs are the one
deliberate exception, reconciled at merge, not edited concurrently in the same working tree).

## Gates

- [ ] Implementation verified (`npm run verify` green in the task's worktree)
- [ ] Handoff written with evidence and open questions (`docs/swarm/handoffs/TASK-002-implementer.md`)
- [ ] Orchestrator integration review complete
- [ ] Human merge approval received
