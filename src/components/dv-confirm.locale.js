/**
 * @module components/dv-confirm.locale
 * `dv-confirm`'s own locale bundle (ADR-0019) — co-located, not centralized, so wiring another
 * component never touches this file. `en` matches the component's pre-existing hardcoded
 * defaults verbatim.
 *
 * `confirmingLabel` is new: previously the pending-state group `aria-label` reused the same
 * `label` key as the initial button (both read `str('label', ...)` with different per-call-site
 * fallbacks) — an incidental coupling, not a documented or tested contract. This primitive gives
 * it its own key/override lever (`data-confirming-label`) instead of carrying that coupling
 * forward into the bundle system; see `adr/0019-i18n-locale-primitive.md`.
 */
export default {
  en: {
    label: 'Delete',
    confirmingLabel: 'Confirm action',
    message: 'Are you sure?',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
  },
  tr: {
    label: 'Sil',
    confirmingLabel: 'İşlemi onayla',
    message: 'Emin misiniz?',
    confirmLabel: 'Onayla',
    cancelLabel: 'Vazgeç',
  },
};
