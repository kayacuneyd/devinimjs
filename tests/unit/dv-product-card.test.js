/**
 * One extra edge-case test for <dv-product-card> (TASK-003 priority 7, best-effort). The
 * happy-path smoke test lives in `atomic-components.test.js` and is left in place.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-product-card.js');
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('missing data attributes fall back to defaults (name "Product", price 0) and still emit', async () => {
  const el = document.createElement('dv-product-card');
  document.body.appendChild(el);
  assert.equal(el.querySelector('h3').textContent, 'Product');
  assert.equal(el.querySelector('p').textContent, '0');

  const seen = [];
  el.addEventListener('dv:add-to-cart', (e) => seen.push(e.detail));
  el.querySelector('button').click();
  await settle();
  assert.deepEqual(seen, [{ id: '', name: 'Product', price: 0 }]);
});
