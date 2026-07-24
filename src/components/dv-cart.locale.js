/**
 * @module components/dv-cart.locale
 * `dv-cart`'s own locale bundle (ADR-0019) — co-located, not centralized, so wiring another
 * component never touches this file. `en` matches the component's pre-existing hardcoded
 * defaults verbatim. `decreaseLabel`/`increaseLabel`/`quantityLabel` are parameterized —
 * `{name}` is substituted per row (ADR-0019) so a translator controls word order, not just a
 * spliced-in value.
 */
export default {
  en: {
    empty: 'Your cart is empty.',
    label: 'Cart',
    removeLabel: 'Remove',
    totalLabel: 'Total',
    decreaseLabel: 'Decrease {name}',
    increaseLabel: 'Increase {name}',
    quantityLabel: '{name} quantity',
  },
  tr: {
    empty: 'Sepetiniz boş.',
    label: 'Sepet',
    removeLabel: 'Kaldır',
    totalLabel: 'Toplam',
    decreaseLabel: '{name} azalt',
    increaseLabel: '{name} artır',
    quantityLabel: '{name} adedi',
  },
};
