/**
 * @module components/dv-state.locale
 * `dv-state`'s own locale bundle (ADR-0019) — co-located, not centralized, so wiring another
 * component never touches this file. `en` matches the component's pre-existing hardcoded
 * defaults verbatim. Only `loading`/`error`/`retryLabel`/`empty` are wired — `state` is
 * configuration (selects which render branch runs), not translatable copy, per
 * `docs/guides/i18n.md` §1.
 *
 * `retryLabel` also fixes a pre-existing bug: the component previously called
 * `this.str('retry-label', 'Try again')`, a literal kebab-case string passed as a dataset key —
 * `HTMLElement.dataset` only exposes camelCase properties (ADR-0005), so `data-retry-label` never
 * actually reached that call in a real browser (`docs/component-manifest.json` already documents
 * `data-retry-label` as the intended attribute). Same class of bug as `dv-confirm`'s
 * `confirm-label`/`cancel-label` and `dv-cart`'s `remove-label`/`total-label`, fixed the same way
 * while porting the call through `t()`.
 */
export default {
  en: {
    loading: 'Loading…',
    error: 'Something went wrong.',
    retryLabel: 'Try again',
    empty: 'Nothing to show yet.',
  },
  tr: {
    loading: 'Yükleniyor…',
    error: 'Bir şeyler ters gitti.',
    retryLabel: 'Tekrar dene',
    empty: 'Henüz gösterilecek bir şey yok.',
  },
};
