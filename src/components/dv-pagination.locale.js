/**
 * @module components/dv-pagination.locale
 * `dv-pagination`'s own locale bundle (ADR-0019) — co-located, not centralized, so wiring
 * another component never touches this file. `en` matches the component's pre-existing
 * hardcoded defaults verbatim. `pageLabel`/`jumpAriaLabel` are parameterized — `{page}`/`{pages}`
 * are substituted per call site (ADR-0019) so a translator controls word order, not just a
 * spliced-in value.
 */
export default {
  en: {
    label: 'Pagination',
    jumpLabel: 'Jump to page',
    previousLabel: 'Previous',
    nextLabel: 'Next',
    previousPageLabel: 'Previous page',
    nextPageLabel: 'Next page',
    pageLabel: 'Page {page}',
    jumpAriaLabel: 'Jump to page, 1 to {pages}',
    goLabel: 'Go',
  },
  tr: {
    label: 'Sayfalama',
    jumpLabel: 'Sayfaya git',
    previousLabel: 'Önceki',
    nextLabel: 'Sonraki',
    previousPageLabel: 'Önceki sayfa',
    nextPageLabel: 'Sonraki sayfa',
    pageLabel: '{page}. sayfa',
    jumpAriaLabel: 'Sayfaya git, 1 ile {pages} arası',
    goLabel: 'Git',
  },
};
