# Task: TASK-001 — Starter-kit scaffolding CLI

## Goal

Let a new consumer bootstrap a working DevinimJS project with one command instead of hand-
assembling files from the README snippet. This is the highest-priority gap in
`docs/roadmap.md`'s P0 list: "no project scaffolding/starter-kit."

## Scope and non-goals

In scope:
- A dev-time Node script, `scripts/create-project.mjs`, in the style of the existing
  `scripts/create-component.mjs` (same CLI ergonomics: positional target dir, `--format=static|php`,
  `--dry-run`, `--force`, refuses to overwrite existing files).
- Two starter formats, mirroring `examples/counter.html` and `examples/counter.php`:
  - `static`: a minimal `index.html` importing DevinimJS as plain ES modules (no build step),
    plus a copied/adapted `dv-counter.js` component and its module import.
  - `php`: the same, but `index.php` printing the initial `data-*` state server-side, matching
    the pattern in `docs/guides/php-integration.md`.
- A new npm script `"create:project": "node scripts/create-project.mjs"` in `package.json`.
- A short guide, `docs/guides/starter-kit.md`, and a "Starter kit" bullet added to `README.md`'s
  Quick start section (do not restructure the rest of the README).
- Because this adds a new public-facing capability (a scaffolding command consumers will run),
  write `adr/0016-starter-kit-cli.md` recording the decision, following the existing ADR format
  (see `adr/0010-mvp-scope.md` or `adr/0012-hash-router.md` for structure/tone). Register it in
  `adr/INDEX.md` (table + dependency graph) and add a CHANGELOG entry under `[Unreleased]`.
- A unit or script-level test proving the generator produces a valid starter (e.g. run it into a
  temp dir, assert expected files exist and are non-empty) — follow the pattern of
  `scripts/validate-component.mjs`/its test if one exists, or add a `tests/unit/create-project.test.js`
  using `node:test` + `node:fs` + `node:child_process` (or direct function import if the script
  is structured to allow it — prefer importable functions over shelling out, matching how
  `create-component.mjs` is likely structured; check it first).

Out of scope (explicitly, per the roadmap's own P0/P1 split and the constitution's YAGNI rule):
- Do NOT add an npm `bin` field or attempt to make this runnable via `npx devinimjs create` —
  that changes package distribution/publishing surface and is a separate decision. Note it as a
  follow-up in your handoff instead.
- Do NOT touch `src/core/*.js` or any shipped component — this is tooling only.
- Do NOT add a framework/build-tool dependency (esbuild is already a devDependency and may be
  reused if genuinely needed for copying/minifying, but prefer plain `node:fs` copy — the
  generated starter must stay build-free per `README.md`'s "Build-free compatibility contract").

## Acceptance criteria

- `node scripts/create-project.mjs /tmp/some-dir --format=static` produces a directory that, when
  served as static files, renders a working `dv-counter` in a browser (verify via reasoning/DOM
  structure if a live browser check isn't practical in this environment; say so explicitly if so).
- `--format=php` produces an `index.php` consistent with `examples/counter.php`'s pattern.
- `npm run lint`, `npm test`, and `npm run size` all still pass (the size gate must be unaffected
  since this is dev tooling, not runtime code).
- `adr/0016-starter-kit-cli.md` exists, is registered in `adr/INDEX.md`, and states the "why" for
  the format/scope choices (especially the "no `bin` entry yet" boundary).
- `README.md` and the new `docs/guides/starter-kit.md` document the command clearly enough that a
  new user (or an AI agent reading `site/llms.txt`-style context) could use it without guessing.

## Inputs

- Product/feature spec: `docs/roadmap.md` P0 — "No project scaffolding/starter-kit."
- Relevant ADRs: `adr/0010-mvp-scope.md`, `constitution.md` (build-free contract, YAGNI).
- Relevant playbooks: `.` this task file; `docs/swarm/README.md`.
- Read first: `scripts/create-component.mjs`, `scripts/validate-component.mjs`,
  `examples/counter.html`, `examples/counter.php`, `docs/guides/php-integration.md`, `README.md`
  Quick start section, `package.json` scripts block.

## Roles and outputs

| Role | Owner | Output file | Depends on |
| --- | --- | --- | --- |
| Orchestrator | this session (claude) | `docs/swarm/tasks/TASK-001-starter-kit-cli.md` | — |
| Implementer | dispatched agent (isolated worktree) | `docs/swarm/handoffs/TASK-001-implementer.md` | — |

## Exclusive file ownership

| Path or glob | Sole writer | Branch/worktree |
| --- | --- | --- |
| `scripts/create-project.mjs` | TASK-001 implementer | isolated worktree, branch `swarm/task-001-starter-kit-cli` |
| `tests/unit/create-project.test.js` (or similar name) | TASK-001 implementer | same |
| `docs/guides/starter-kit.md` | TASK-001 implementer | same |
| `adr/0016-starter-kit-cli.md` | TASK-001 implementer | same |
| `adr/INDEX.md`, `CHANGELOG.md`, `README.md`, `package.json` (append-only, small edits) | TASK-001 implementer | same |

No overlap with TASK-002 or TASK-003's file ownership.

## Gates

- [ ] Implementation verified (`npm run verify` green in the task's worktree)
- [ ] Handoff written with evidence and open questions (`docs/swarm/handoffs/TASK-001-implementer.md`)
- [ ] Orchestrator integration review complete
- [ ] Human merge approval received
