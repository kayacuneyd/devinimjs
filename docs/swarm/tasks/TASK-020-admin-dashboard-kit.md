# TASK-020 — Admin/CRUD dashboard starter kit (pilot)

## Goal

Prove that a CKCSS pattern and a set of real DevinimJS components can be composed into one
working, copyable starter — closing the gap between CKCSS's just-finished UI Kit Patterns
library and DevinimJS's component catalog, so future work can assemble a real admin screen by
copying a kit instead of generating one from scratch each time.

## Scope

- Record the design decision as `adr/0020-starter-kits.md`.
- Add `kits/admin-dashboard/index.html`, structurally based on CKCSS's `data-management.html`
  pattern region, composing `<dv-data-table>`, `<dv-modal>` + `<dv-field>`, `<dv-confirm>` and
  `<dv-toast-stack>` through their existing documented `data-*`/event contracts only.
- Add `--kit=<name>` to `scripts/create-project.mjs` (accepts `admin-dashboard` only for this
  task), copying the kit's HTML plus the exact `dist/modules/dv-*.js` files it uses.
- Fix the prerequisite bug found in `scripts/build-dist.mjs`: `dist/modules/<name>.js` left
  `../core/i18n.js`, `../core/transition.js` and each component's own `./<name>.locale.js` as
  unresolved relative imports, 404ing once copied outside this repo's own `dist/` tree. Add
  regression coverage (`tests/unit/dist-modules-self-contained.test.js`).
- Update `docs/guides/starter-kit.md`, `README.md`, `CHANGELOG.md`, `docs/roadmap.md`.

## Acceptance criteria

- `npm run lint`, `npm test`, `npm run size` pass.
- `node scripts/create-project.mjs <dir> --kit=admin-dashboard` generates a working, self-hosted
  (aside from the existing pinned-CDN CKCSS stylesheet link) folder with no build step.
- Manual verification: table renders from seed data; search/sort/pagination work; New Project →
  modal → save → row appears + toast fires; delete → confirm → row removed + toast fires;
  keyboard-only pass through toolbar/table/modal/confirm; no console errors.
- The kit's own markup uses only CKCSS classes/tokens — no raw color/spacing/radius literals.
- `docs/roadmap.md` records the kit system as a new, closed gap and explicitly lists auth-kit and
  marketing-landing-kit as deferred follow-ups.

## Constraints

- Follow `constitution.md` v2.0.0: no invented component API, no raw design-value literals, no
  new runtime dependency, build-free consumer path preserved.
- Do not edit any file under `/var/www/ckcss` — the kit is DevinimJS-owned and only references
  CKCSS's pattern by path/description, per ADR-0020's Option A rejection.
- No `--format=php` kit support, no additional kits, no CKCSS self-hosting change — explicitly
  deferred in ADR-0020's Follow-ups.

## Execution

Implemented directly in one session (single implementer, no worktree ceremony — matches how
smaller single-scope items like the `component-manifest.json` refresh were handled). Human
review/merge required before this lands on `main`, per `docs/swarm/README.md`'s non-negotiable
rules.
