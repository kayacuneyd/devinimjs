/**
 * @module components/dv-data-table.locale
 * `dv-data-table`'s own locale bundle (ADR-0019) — co-located, not centralized, so wiring
 * another component never touches this file. `en` matches the component's pre-existing
 * hardcoded defaults verbatim. `paginationLabel` is resolved here via `t()` and then forwarded
 * as the composed `<dv-pagination>`'s `data-label` override (see `#syncPagination()`) — the
 * existing `data-*`-override-wins tier (ADR-0005) means the forwarded, already-resolved string
 * always wins on the child, so no extra plumbing is needed for the composition to stay correct
 * under a non-English active locale.
 *
 * Bug fix, in scope (same pattern as ADR-0019's `dv-confirm`/`dv-cart` fixes): the pre-existing
 * code called `this.str('filter-label', 'Filter')` and `this.str('pagination-label',
 * 'Pagination')` — literal kebab-case strings passed as dataset keys. `HTMLElement.dataset` only
 * exposes camelCase named properties per spec, so `data-filter-label`/`data-pagination-label`
 * never actually worked as overrides in production. Routed through `t()` with the correct
 * camelCase keys (`filterLabel`, `paginationLabel`) instead — a fix, not a regression, since
 * nothing depended on the broken behavior.
 */
export default {
  en: {
    filterLabel: 'Filter',
    label: 'Data table',
    paginationLabel: 'Pagination',
  },
  tr: {
    filterLabel: 'Filtrele',
    label: 'Veri tablosu',
    paginationLabel: 'Sayfalama',
  },
};
