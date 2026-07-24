# Admin dashboard kit

A working CRUD project list: search, sort and paginate a table, create a project through a
modal form, delete one through a confirm step, with toast feedback on both — assembled from
real DevinimJS components on top of CKCSS's visual system, no framework beyond the two.

Generate it: `node scripts/create-project.mjs <dir> --kit=admin-dashboard` (see
`docs/guides/starter-kit.md`).

## Based on

Structurally based on CKCSS's `data-management.html` pattern (`ckcss/site/data-management.html`,
documented in `ckcss/docs/product/patterns.md`) — the search input, table and manual Prev/Next
pagination in that static pattern are replaced here by `<dv-data-table>`'s built-in equivalent.
CKCSS's own pattern file is unmodified; this kit is a separate, DevinimJS-owned page (ADR-0020).

## Components used

| Component | Role | Contract |
|---|---|---|
| `<dv-data-table>` | Search, sort, paginate the project list | `data-columns`/`data-rows` JSON, `data-page-size` |
| `<dv-modal>` | "New project" dialog | `data-open` (toggled via its `open()`/`close()` methods) |
| `<dv-field>` (×3) | Name / owner / status inputs inside the modal | `data-name`/`data-label`/`data-required`; `state.value` read on submit |
| `<dv-confirm>` | Two-step "delete the selected project" | `dv:confirm` event |
| `<dv-toast-stack>` | Save/delete feedback | `.show(message)` |
| `<dv-state>` | Empty-list message when every project is deleted | `data-state="empty"`, toggled via `hidden` |

## Known limitation (by design, not a bug)

`<dv-data-table>` renders plain-text cells only — it has no per-row action slot. That's why
"delete" lives in its own small panel below the table (pick a project from a `<select>`, then
confirm) instead of a delete button inside each row. Adding row-action slots to `<dv-data-table>`
would be a real component-API change, out of scope for a kit (ADR-0020's "no invented component
API" constraint) — a candidate for its own future ADR if a real use case needs it.

## Customizing

- Swap the seed `data-rows`/`data-columns` JSON for your own data.
- Add more `<dv-field>`s to the create form the same way — one `<dv-field>`, one entry in the
  glue script's `setRows([...rows(), { ... }])` call.
- Re-theme by swapping the linked CKCSS stylesheet for your own token set; every visual value
  here comes from CKCSS classes/tokens, none is hardcoded (constitution v2.0.0).
