/**
 * @module components/dv-toast-stack.locale
 * `dv-toast-stack`'s own locale bundle (ADR-0019) — co-located, not centralized, so wiring
 * another component never touches this file. `en` matches the component's pre-existing hardcoded
 * defaults verbatim. `dismiss` is newly routed through `t()` — it was previously a literal
 * `aria-label="Dismiss"` in the template, never passed through `str()` at all (same situation as
 * `dv-modal`'s `close` aria-label before TASK-008, and `dv-pagination`'s un-`str()`'d strings in
 * TASK-009).
 */
export default {
  en: {
    label: 'Notifications',
    dismiss: 'Dismiss',
  },
  tr: {
    label: 'Bildirimler',
    dismiss: 'Kapat',
  },
};
