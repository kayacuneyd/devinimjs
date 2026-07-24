/**
 * @module components/dv-field.locale
 * `dv-field`'s own locale bundle (ADR-0019) — co-located, not centralized, so wiring another
 * component never touches this file. `en` matches the component's pre-existing hardcoded
 * defaults verbatim. Only `label`/`error` are wired — `id`/`name`/`control`/`type`/`placeholder`
 * are configuration (element identity, which HTML element to render, a literal input type), not
 * translatable copy, per `docs/guides/i18n.md` §1.
 */
export default {
  en: {
    label: 'Field',
    error: 'Please enter a valid value.',
  },
  tr: {
    label: 'Alan',
    error: 'Lütfen geçerli bir değer girin.',
  },
};
