/**
 * @module components/dv-product-card.locale
 * `dv-product-card`'s own locale bundle (ADR-0019) — co-located, not centralized, so wiring
 * another component never touches this file. `en` matches the component's pre-existing
 * hardcoded default verbatim.
 *
 * `name`'s `'Product'` fallback is deliberately **not** wired here — it's a generic
 * missing-product-data placeholder read once via `initialState()`, not UI chrome copy in the
 * same sense as the add-to-cart button label (see the component file's judgment-call note and
 * the TASK-011 handoff for the full reasoning).
 */
export default {
  en: {
    action: 'Add to cart',
  },
  tr: {
    action: 'Sepete ekle',
  },
};
