/** @module stores/cart - Example shared cart domain store. */
import { createStore } from '../core/store.js';

/** Shared cart state for product-list and cart-summary components. */
export const cartStore = createStore({ items: [] });

/** @param {{ id: string, name: string, price: number }} product - Product to add. */
export function addToCart(product) {
  const item = cartStore.state.items.find((entry) => entry.id === product.id);
  if (item) item.quantity++;
  else cartStore.state.items.push({ ...product, quantity: 1 });
}
