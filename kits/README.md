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

Auth and marketing-landing kits are deferred follow-ups (ADR-0020) — not yet built.
