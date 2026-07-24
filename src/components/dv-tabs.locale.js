/**
 * @module components/dv-tabs.locale
 * `dv-tabs`'s own locale bundle (ADR-0019) — co-located, not centralized, so wiring another
 * component never touches this file. `en` matches the component's pre-existing hardcoded
 * default verbatim. Only the tablist's `aria-label` is wired here — tab activation, keyboard
 * nav and panel/`aria-selected` logic are untouched (ADR-0010, this is the library's
 * accessibility reference component).
 */
export default {
  en: {
    label: 'Tabs',
  },
  tr: {
    label: 'Sekmeler',
  },
};
