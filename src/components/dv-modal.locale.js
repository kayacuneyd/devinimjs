/**
 * @module components/dv-modal.locale
 * `dv-modal`'s own locale bundle (ADR-0019) — co-located, not centralized, so wiring another
 * component never touches this file. `en` matches the component's pre-existing hardcoded
 * defaults verbatim.
 */
export default {
  en: {
    label: 'Dialog',
    close: 'Close',
  },
  tr: {
    label: 'Pencere',
    close: 'Kapat',
  },
};
