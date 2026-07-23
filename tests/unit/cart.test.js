import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cartStore, addToCart } from '../../src/stores/cart.js';

test('cart store coalesces matching products into a quantity', () => {
  cartStore.state.items.splice(0);
  addToCart({ id: 'keyboard', name: 'Keyboard', price: 99 });
  addToCart({ id: 'keyboard', name: 'Keyboard', price: 99 });
  assert.deepEqual(cartStore.state.items, [{ id: 'keyboard', name: 'Keyboard', price: 99, quantity: 2 }]);
});

test('cart store keeps distinct products separate by id', () => {
  cartStore.state.items.splice(0);
  addToCart({ id: 'keyboard', name: 'Keyboard', price: 99 });
  addToCart({ id: 'mouse', name: 'Mouse', price: 25 });
  assert.deepEqual(cartStore.state.items, [
    { id: 'keyboard', name: 'Keyboard', price: 99, quantity: 1 },
    { id: 'mouse', name: 'Mouse', price: 25, quantity: 1 },
  ]);
});
