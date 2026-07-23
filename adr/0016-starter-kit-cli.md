# ADR-0016: Starter-kit scaffolding CLI

- **Status:** Accepted
- **Date:** 2026-07-23
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §2.1 (YAGNI), §9.3 (budgets not affected — dev tooling only)
- **Depends on:** ADR-0007 (distribution & versioning), ADR-0010 (MVP scope)

## Context

`docs/roadmap.md`'s P0 gap list names "no project scaffolding/starter-kit" as the single biggest
friction point for building fast with DevinimJS, for both humans and AI agents: today a new
project is assembled file-by-file from the README snippet or a CDN pin. `scripts/create-component.mjs`
already proves the CLI ergonomics this project favors (positional argument, `--format`,
`--dry-run`, `--force`, refuse-by-default overwrite protection) for scaffolding a component inside
this repo. This decision extends the same ergonomics to scaffolding a *new consumer project*
outside this repo.

## Decision drivers

- Must not compromise the build-free compatibility contract (`README.md`): the generated project
  has to run as plain files with no build step, exactly like the library itself.
- Must not grow the runtime, its dependency surface, or the size-gated core budget — this is
  dev-time tooling only.
- Must reuse already-solved problems (dist/ artifacts, existing examples) rather than inventing a
  parallel packaging story.
- Must stay inside a single bounded task (constitution §2.1 YAGNI): scaffold a working starter,
  nothing more.

## Considered options

### Option A — copy pre-built `dist/` artifacts (chosen)

`scripts/create-project.mjs` reads this repo's own committed `dist/authoring.min.js` and
`dist/modules/dv-counter.js` and writes them, byte-for-byte, into
`<target>/assets/devinim/`. The generated `index.html`/`index.php` references them with the same
relative-import layout the module already uses in `dist/`
(`components/dv-counter.js` → `../authoring.min.js`), which is also the layout
`docs/guides/php-integration.md` already recommends for self-hosted installs
(`/assets/devinim/components/dv-counter.js`).

Pros: zero build step at generation time (`node:fs` copy only, per the non-goal below); the
generated project is exactly the artifact shape DevinimJS already publishes and documents; no new
packaging surface.
Cons: the starter is pinned to whatever `dist/` currently contains in this checkout — acceptable,
since maintainers rebuild `dist/` before release (`npm run build`) and the generator always reads
the current tree.

### Option B — bundle the source runtime with esbuild at generation time

Run `esbuild` against `src/core/authoring.js` and `src/components/dv-counter.js` when the CLI
executes, producing a fresh bundle per invocation.

Pros: would not depend on `dist/` being current.
Cons: adds a build step to what should be a plain-copy operation, duplicates what
`scripts/build-dist.mjs` already does, and violates the explicit non-goal below (prefer
`node:fs` copy; esbuild only if "genuinely needed" — it is not, since `dist/` already exists and
is committed).

### Option C — inline the unbundled `src/` files with adapted relative imports

Copy `src/core/authoring.js`, `src/core/component.js`, `src/core/html.js`, and
`src/components/dv-counter.js` with rewritten `import` specifiers.

Pros: no dependency on `dist/` being rebuilt.
Cons: more files to keep import-path-correct by hand, more surface for the generator to drift
from the source layout, and no material benefit over Option A since `dist/` is already the
supported "copy these files to shared hosting" artifact per the build-free contract.

## Decision

Adopt **Option A**. `scripts/create-project.mjs` scaffolds two formats:

- `--format=static` (default): `index.html` + `assets/devinim/{authoring.min.js,components/dv-counter.js}`.
- `--format=php`: the same assets plus an `index.php` that prints `data-start`/`data-step`
  server-side, mirroring `examples/counter.php`.

CLI ergonomics mirror `scripts/create-component.mjs`: positional target directory, `--format`,
`--dry-run`, `--force`, refuse-to-overwrite by default. `npm run create:project` wraps it.

**No `bin` entry / `npx devinimjs create` yet.** Adding an npm `bin` field changes what gets
published and how consumers invoke the tool (global or `npx`-resolved execution, a stable CLI
argument contract, likely its own semver expectations) — that is a packaging/distribution
decision, not a scaffolding decision, and deserves its own ADR and task rather than being
smuggled in here. `node scripts/create-project.mjs …` (or `npm run create:project --`) is
sufficient for the P0 gap this task closes: a repo checkout (or the published `devinimjs` npm
package's `scripts/` — already listed in `package.json`'s `files`) can run it today.

## Consequences

**Positive:** closes the highest-priority P0 roadmap gap with no new runtime dependency, no
runtime code touched, and no size-budget impact; the generated project is provably build-free
because it is a literal copy of the same artifacts already documented for self-hosted install.

**Negative / to manage:** the generator only ships one component (`dv-counter`) today; a consumer
who wants more components copies further `dist/modules/*.js` files by hand (documented in
`docs/guides/starter-kit.md`). A future task could extend `--format` or add a `--components=`
flag once there is a real multi-component starter use case (YAGNI for now).

**Follow-ups:**
- `npx devinimjs create` / npm `bin` entry — separate decision, separate ADR, out of scope here.
- Multi-component starter selection — only if requested by real usage.
