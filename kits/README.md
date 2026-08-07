# Starter kits

A kit is a complete, working page composing a named CKCSS pattern with real DevinimJS
components — proof that the two libraries produce a real application screen, not just a demo
widget. See `adr/0020-starter-kits.md` for the design decision.

## Kit rules

- A kit's source lives here, in `kits/<name>/`, as new DevinimJS content. **Never edit a file
  under `/var/www/ckcss`** — a kit is inspired by a named CKCSS pattern (cited by path in the
  kit's own `README.md`), it does not modify CKCSS's own JS-free pattern files.
- Data flows through each component's existing documented `data-*`/event contract only
  (`design/component-library.md`). No new component API, no new authoring pattern.
- Any imperative wiring between components (e.g. "save closes the modal and shows a toast") is a
  small, page-owned `<script type="module">` — the same "page owns the glue" model every other
  DevinimJS example uses (`examples/counter.html`), not a framework feature.
- Use only CKCSS classes and semantic tokens for visual values — no raw color/spacing/radius
  literals (constitution v2.0.0, "Mathematical design and token discipline").
- A kit must remain build-free: `node scripts/create-project.mjs <dir> --kit=<name>` copies the
  kit's HTML plus the exact `dist/modules/dv-*.js` files it needs, nothing is rebuilt or bundled
  at generation time or inside the generated project.

## Available kits

- `admin-dashboard` — CRUD project list based on CKCSS's `data-management.html` pattern:
  `<dv-data-table>` (search/sort/pagination), `<dv-modal>` + `<dv-field>` (create), `<dv-confirm>`
  (delete), `<dv-toast-stack>` (feedback). See `admin-dashboard/README.md`.
- `ci4-cms` — fullstack starter: CodeIgniter 4 + SQLite CMS backend (session auth, REST API,
  dynamic content types, media library, plugin hooks) with a DevinimJS hash-router admin SPA
  and a server-rendered public theme. Implements the roadmap's backend chapters (Bölüm 2.1–2.10,
  ADR-001…006). It is a **PHP overlay kit**, not wired into `create-project.mjs`: you copy its
  `app/` over a stock `codeigniter4/appstarter` install. See `ci4-cms/README.md`.

Auth and marketing-landing kits are deferred follow-ups (ADR-0020) — not yet built.
