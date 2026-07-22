import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) globalThis[key] = window[key];
await import('../../src/components/dv-dropdown.js');
await import('../../src/components/dv-search.js');
await import('../../src/components/dv-product-card.js');

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('dropdown toggles its consumer-owned menu', async () => {
  const el = document.createElement('dv-dropdown');
  el.innerHTML = '<button role="menuitem">Profile</button>';
  document.body.appendChild(el);
  const trigger = el.querySelector('button');
  trigger.click();
  await settle();
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(el.querySelector('[role="menu"]').hidden, false);
});

test('search emits a query event and can clear', async () => {
  const el = document.createElement('dv-search');
  document.body.appendChild(el);
  const seen = [];
  el.addEventListener('dv:query', (event) => seen.push(event.detail.query));
  const input = el.querySelector('input');
  input.value = 'Keyboard';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  await settle();
  el.querySelector('button').click();
  await settle();
  assert.deepEqual(seen, ['Keyboard', '']);
});

test('product card emits its configured product', async () => {
  const el = document.createElement('dv-product-card');
  el.setAttribute('data-id', 'keyboard');
  el.setAttribute('data-name', 'Keyboard');
  el.setAttribute('data-price', '99');
  document.body.appendChild(el);
  const seen = [];
  el.addEventListener('dv:add-to-cart', (event) => seen.push(event.detail));
  el.querySelector('button').click();
  await settle();
  assert.deepEqual(seen, [{ id: 'keyboard', name: 'Keyboard', price: 99 }]);
});
