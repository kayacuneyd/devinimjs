# Handoff: TASK-001 — Implementer

## Status

Complete

## Inputs reviewed

- `docs/swarm/README.md` (swarm rules: file ownership, handoff-with-evidence, no self-merge).
- `docs/swarm/tasks/TASK-001-starter-kit-cli.md` (full task contract).
- `docs/roadmap.md` P0 gap: "No project scaffolding/starter-kit."
- `adr/0010-mvp-scope.md`, `adr/0012-hash-router.md` (ADR structure/tone reference).
- `constitution.md` (build-free boundary, YAGNI).
- `scripts/create-component.mjs` — confirmed it is a top-level script (no exported functions),
  so the test shells out via `node:child_process`, matching the existing precedent in
  `tests/unit/component-validator.test.js` (which does the same for `validate-component.mjs`).
- `scripts/validate-component.mjs`.
- `examples/counter.html`, `examples/counter.php`.
- `docs/guides/php-integration.md` (confirmed the documented self-hosted layout —
  `/assets/devinim/components/dv-counter.js` — matches `dist/`'s own relative-import structure).
- `README.md` Quick start section, `package.json` scripts block.
- `scripts/build-dist.mjs` (to understand how `dist/authoring.min.js` and
  `dist/modules/dv-counter.js` are produced and how they cross-reference each other — this is
  what made the "copy pre-built dist/ artifacts" design decision possible).
- `adr/INDEX.md`, `adr/_template.md`, `CHANGELOG.md`, `eslint.config.mjs`,
  `docs/swarm/handoffs/_template.md`.

## Evidence and findings

**Design decision:** `scripts/create-project.mjs` copies this repo's own committed
`dist/authoring.min.js` and `dist/modules/dv-counter.js` byte-for-byte into
`<target>/assets/devinim/`, rather than re-bundling from `src/`. This keeps generation a pure
`node:fs` copy (no esbuild invocation), matches the layout `docs/guides/php-integration.md`
already documents for self-hosted installs, and needed no new build-tool dependency. Full
rationale and rejected alternatives are in `adr/0016-starter-kit-cli.md`.

Manual smoke tests (also codified as automated tests, see below):

```
$ node scripts/create-project.mjs /tmp/dv-starter-static --format=static
created index.html
created assets/devinim/authoring.min.js
created assets/devinim/components/dv-counter.js

$ node scripts/create-project.mjs /tmp/dv-starter-php --format=php
created index.php
created assets/devinim/authoring.min.js
created assets/devinim/components/dv-counter.js

$ php -l /tmp/dv-starter-php/index.php
No syntax errors detected in /tmp/dv-starter-php/index.php

$ node scripts/create-project.mjs /tmp/dv-starter-static --format=static   # no --force
Refusing to overwrite index.html; use --force only when intentional.
(exit 1)

$ node scripts/create-project.mjs /tmp/dv-starter-static --format=static --force
created index.html ...   (exit 0)

$ node scripts/create-project.mjs /tmp/x --format=bogus
The project format must be "static" or "php".   (exit 1)
```

Real-DOM proof that the generated static starter renders a working `<dv-counter>` (happy-dom,
since a live browser wasn't practical to drive interactively in this environment — this is codified
as the third test case in `tests/unit/create-project.test.js`):

```
output text: 3
after increment: 5
```

**`npm run lint`** — pass, zero errors/warnings:

```
> devinimjs@0.6.0-beta.0 lint
> eslint .
(no output — clean)
```

**`npm test`** — pass, 91/91 (85 pre-existing + 6 new in `tests/unit/create-project.test.js`):

```
# tests 91
# pass 91
# fail 0
```

**`npm run size`** — pass, unaffected by this change (dev tooling only):

```
core bundle: 8269 B min, 3316 B min+gzip (budget 4096 B)
SIZE GATE PASSED
```

**`npm run verify`** (lint + test + e2e + size) — lint/test/size pass; the Playwright e2e leg
fails in this sandbox with `Executable doesn't exist at .../chromium-1228/chrome-linux64/chrome`
— **a missing browser binary in this environment, unrelated to this task's changes**. None of the
19 failing specs touch any file this task modified (`examples/`, `site/`, `src/`, `tests/e2e/` are
untouched). Recommend the orchestrator either re-run e2e in an environment with the Playwright
browser installed, or treat this as a pre-existing environment gap rather than a regression.

## Changed files

- `scripts/create-project.mjs` (new) — the generator.
- `tests/unit/create-project.test.js` (new) — 6 tests: static format contents, php format
  contents, real-DOM render/update proof (happy-dom), `--dry-run` no-op, overwrite refusal +
  `--force`, invalid `--format`/missing target error handling.
- `docs/guides/starter-kit.md` (new) — usage guide.
- `adr/0016-starter-kit-cli.md` (new) — decision record, including the "no `bin` entry yet"
  boundary and considered alternatives (esbuild-at-generation-time, inline `src/` copy).
- `adr/INDEX.md` — registered ADR-0016 in the table and dependency graph.
- `CHANGELOG.md` — added an `[Unreleased]` entry.
- `README.md` — added one "Starter kit" bullet to Quick start (rest of the section untouched).
- `package.json` — added `"create:project": "node scripts/create-project.mjs"` to `scripts`.
- `docs/swarm/handoffs/TASK-001-implementer.md` (this file).

No files outside the task's exclusive-ownership list were touched. `src/core/*`, shipped
components, and `site/llms.txt` were read for context only, never edited. A `test-results/`
directory got polluted by an interim `npm run verify` run in this sandbox; it was reverted with
`git checkout -- test-results/.last-run.json && git clean -fd test-results/` before committing —
final `git status` before commit showed only the files listed above.

Committed on branch `swarm/task-001-starter-kit-cli` (this worktree's branch was renamed from its
default `worktree-agent-a042a670ca9a73123` name to match the task contract's designated branch;
it had no upstream tracking, so this was a safe local-only rename). Not pushed, not merged.

## Open questions and risks

- **No `npm bin`/`npx devinimjs create` entry**, per the task's explicit non-goal. Flagging as
  instructed: this is the natural next-step follow-up once there's a real need for global/`npx`
  invocation, but it changes the package's publishing/distribution surface and deserves its own
  ADR + task rather than being folded into this one. Noted as a follow-up in ADR-0016.
- The starter currently ships exactly one component (`dv-counter`). Extending `--format` or
  adding a `--components=` selector is deliberately deferred (YAGNI) until there's a real
  multi-component starter use case — documented as a follow-up in ADR-0016 and
  `docs/guides/starter-kit.md`.
- The generator reads `dist/authoring.min.js` and `dist/modules/dv-counter.js` from whatever is
  currently committed in `dist/`. If a future change edits `dv-counter`'s source without running
  `npm run build` first, the starter kit would ship stale output — same staleness risk `dist/`
  already carries for every other consumer of the committed distribution (ADR-0007), not a new
  one introduced here.
- E2E (`npm run test:e2e` / the last leg of `npm run verify`) could not be verified in this
  sandbox — Playwright's Chromium binary isn't installed here. This is an environment limitation,
  not a result of this task's changes; the orchestrator should confirm e2e separately in a
  browser-equipped environment before final merge sign-off.
- `docs/swarm/` was not present in this worktree's git history (it exists as uncommitted content
  in the shared checkout at `/var/www/devinimjs/docs/swarm/`, which this isolated worktree can't
  write to). This handoff and the task/README files were read via absolute path from the shared
  checkout for context; this handoff file itself is written and committed inside this worktree at
  the same relative path so the orchestrator can retrieve it from the branch
  `swarm/task-001-starter-kit-cli`.

## Next recipient

Orchestrator
